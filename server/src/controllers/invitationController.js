import crypto from 'crypto';
import { Invitation } from '../models/Invitation.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { CacheService } from '../services/cacheService.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { sendEmail } from '../config/email.js';
import { NotificationService } from '../services/notificationService.js';

export const createInvitation = async (req, res, next) => {
  try {
    const { email, role = 'MEMBER' } = req.body;
    const workspace = req.workspace;

    // Check if target user is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const alreadyMember = await WorkspaceMember.findOne({
        workspace: workspace._id,
        user: existingUser._id,
      });
      if (alreadyMember) {
        throw ApiError.badRequest('User is already a member of this workspace');
      }
    }

    const token = crypto.randomBytes(32).toString('hex');

    const invitation = await Invitation.create({
      workspace: workspace._id,
      email,
      role,
      invitedBy: req.user._id,
      token,
    });

    const inviteUrl = `${req.protocol}://${req.get('host')}/invitations/${token}`;

    await sendEmail({
      to: email,
      subject: `You've been invited to join ${workspace.name} on SyncBoard`,
      html: `
        <h3>Join ${workspace.name} on SyncBoard</h3>
        <p><strong>${req.user.name}</strong> invited you to collaborate in their workspace as <strong>${role}</strong>.</p>
        <p><a href="${inviteUrl}">Accept Invitation</a></p>
        <p>Or use invitation token: <code>${token}</code></p>
      `,
      text: `Join ${workspace.name}: ${inviteUrl}`,
    });

    if (existingUser) {
      await NotificationService.create({
        recipient: existingUser._id,
        sender: req.user._id,
        workspace: workspace._id,
        type: 'WORKSPACE_INVITE',
        title: 'Workspace Invitation',
        message: `${req.user.name} invited you to join ${workspace.name}`,
        link: `/invitations/${token}`,
        data: { token, workspaceId: workspace._id },
      });
    }

    return ApiResponse.created(res, { invitation }, 'Invitation sent successfully');
  } catch (error) {
    next(error);
  }
};

export const getPendingInvitations = async (req, res, next) => {
  try {
    const invitations = await Invitation.find({
      workspace: req.workspace._id,
      status: 'pending',
    }).populate('invitedBy', 'name email avatar');

    return ApiResponse.success(res, { invitations });
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).populate('workspace');

    if (!invitation) {
      throw ApiError.badRequest('Invalid or expired invitation token');
    }

    // Ensure user matches email or allow current logged in user
    const syncProjectMemberships = async (workspaceId, userId, role) => {
      try {
        const projects = await Project.find({ workspace: workspaceId, isArchived: false });
        for (const proj of projects) {
          await ProjectMember.findOneAndUpdate(
            { project: proj._id, user: userId },
            {
              project: proj._id,
              workspace: workspaceId,
              user: userId,
              role: role === 'ADMIN' || role === 'OWNER' ? 'LEAD' : 'MEMBER',
            },
            { upsert: true, new: true }
          );
          await CacheService.del(`project:${proj._id}:meta`);
        }
      } catch (err) {
        console.error('[Invitation] Error syncing project memberships:', err);
      }
    };

    let membership = await WorkspaceMember.findOne({
      workspace: invitation.workspace._id,
      user: req.user._id,
    });

    if (membership || invitation.status === 'accepted') {
      invitation.status = 'accepted';
      await invitation.save();

      // Ensure user is added as member to workspace projects
      await syncProjectMemberships(invitation.workspace._id, req.user._id, invitation.role);

      // Update and mark the user's notification as read & accepted
      await Notification.updateMany(
        {
          recipient: req.user._id,
          $or: [
            { 'data.token': token },
            { workspace: invitation.workspace._id, type: 'WORKSPACE_INVITE' },
          ],
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
            title: 'Workspace Invitation (Accepted)',
            message: `You accepted the invitation to join ${invitation.workspace.name}`,
            'data.status': 'accepted',
          },
        }
      );

      return ApiResponse.success(
        res,
        { workspace: invitation.workspace, alreadyMember: true },
        'You are already a member of this workspace'
      );
    }

    if (invitation.expiresAt < new Date()) {
      throw ApiError.badRequest('This invitation has expired');
    }

    membership = await WorkspaceMember.create({
      workspace: invitation.workspace._id,
      user: req.user._id,
      role: invitation.role,
      status: 'active',
    });

    invitation.status = 'accepted';
    await invitation.save();

    // Ensure user is added as member to workspace projects
    await syncProjectMemberships(invitation.workspace._id, req.user._id, invitation.role);

    // Update and mark the user's notification as read & accepted
    await Notification.updateMany(
      {
        recipient: req.user._id,
        $or: [
          { 'data.token': token },
          { workspace: invitation.workspace._id, type: 'WORKSPACE_INVITE' },
        ],
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
          title: 'Workspace Invitation (Accepted)',
          message: `You accepted the invitation to join ${invitation.workspace.name}`,
          'data.status': 'accepted',
        },
      }
    );

    await NotificationService.create({
      recipient: invitation.invitedBy,
      sender: req.user._id,
      workspace: invitation.workspace._id,
      type: 'SYSTEM',
      title: 'Invitation Accepted',
      message: `${req.user.name} accepted your invitation to join ${invitation.workspace.name}`,
    });

    return ApiResponse.success(res, { workspace: invitation.workspace }, 'Invitation accepted successfully');
  } catch (error) {
    next(error);
  }
};

export const declineInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token }).populate('workspace');

    if (!invitation) {
      throw ApiError.badRequest('Invalid or expired invitation token');
    }

    invitation.status = 'declined';
    await invitation.save();

    // Mark the recipient's notification as read & declined
    await Notification.updateMany(
      {
        recipient: req.user._id,
        $or: [
          { 'data.token': token },
          { workspace: invitation.workspace._id, type: 'WORKSPACE_INVITE' },
        ],
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
          title: 'Workspace Invitation (Declined)',
          message: `You declined the invitation to join ${invitation.workspace.name}`,
          'data.status': 'declined',
        },
      }
    );

    await NotificationService.create({
      recipient: invitation.invitedBy,
      sender: req.user._id,
      workspace: invitation.workspace._id,
      type: 'SYSTEM',
      title: 'Invitation Declined',
      message: `${req.user.name} declined the invitation to join ${invitation.workspace.name}`,
    });

    return ApiResponse.success(res, null, 'Invitation declined');
  } catch (error) {
    next(error);
  }
};

export const revokeInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Invitation.findByIdAndDelete(id);
    return ApiResponse.success(res, null, 'Invitation revoked');
  } catch (error) {
    next(error);
  }
};

