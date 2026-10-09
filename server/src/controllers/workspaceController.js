import crypto from 'crypto';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Channel } from '../models/Channel.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ActivityService } from '../services/activityService.js';
import { CacheService } from '../services/cacheService.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description = '', logo = '' } = req.body;
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const slug = `${baseSlug}-${randomSuffix}`;

    const workspace = await Workspace.create({
      name,
      slug,
      description,
      owner: req.user._id,
      logo,
    });

    // Add creator as OWNER member
    await WorkspaceMember.create({
      workspace: workspace._id,
      user: req.user._id,
      role: ROLES.OWNER,
      status: 'active',
    });

    // Create default 'general' chat channel
    await Channel.create({
      workspace: workspace._id,
      name: 'general',
      topic: 'General workspace discussions',
      type: 'public',
      createdBy: req.user._id,
      members: [req.user._id],
    });

    // Log activity
    await ActivityService.log({
      workspace: workspace._id,
      actor: req.user,
      action: 'WORKSPACE_CREATED',
      entityType: 'WORKSPACE',
      entityId: workspace._id,
      details: { workspaceName: workspace.name },
    });

    return ApiResponse.created(res, { workspace }, 'Workspace created successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserWorkspaces = async (req, res, next) => {
  try {
    const memberships = await WorkspaceMember.find({
      user: req.user._id,
      status: 'active',
    }).populate('workspace');

    const workspaces = memberships
      .filter((m) => m.workspace && !m.workspace.isDeleted)
      .map((m) => ({
        ...m.workspace.toObject(),
        role: m.role,
      }));

    return ApiResponse.success(res, { workspaces });
  } catch (error) {
    next(error);
  }
};

export const getWorkspace = async (req, res, next) => {
  try {
    return ApiResponse.success(res, {
      workspace: req.workspace,
      role: req.userRole,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const { name, description, logo, settings } = req.body;
    const workspace = req.workspace;

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (logo !== undefined) workspace.logo = logo;
    if (settings) workspace.settings = { ...workspace.settings, ...settings };

    await workspace.save();

    await CacheService.del(`workspace:${workspace._id}:dashboard`);

    await ActivityService.log({
      workspace: workspace._id,
      actor: req.user,
      action: 'WORKSPACE_UPDATED',
      entityType: 'WORKSPACE',
      entityId: workspace._id,
    });

    return ApiResponse.success(res, { workspace }, 'Workspace updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = req.workspace;
    if (String(workspace.owner) !== String(req.user._id)) {
      throw ApiError.forbidden('Only workspace owner can delete the workspace');
    }

    workspace.isDeleted = true;
    await workspace.save();

    await CacheService.del(`workspace:${workspace._id}:dashboard`);

    return ApiResponse.success(res, null, 'Workspace deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceMembers = async (req, res, next) => {
  try {
    const members = await WorkspaceMember.find({
      workspace: req.workspace._id,
      status: 'active',
    }).populate('user', 'name email avatar status bio lastActiveAt');

    return ApiResponse.success(res, { members });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      throw ApiError.badRequest('Invalid role');
    }

    const membership = await WorkspaceMember.findById(memberId);
    if (!membership || String(membership.workspace) !== String(req.workspace._id)) {
      throw ApiError.notFound('Member not found in this workspace');
    }

    if (membership.role === ROLES.OWNER && role !== ROLES.OWNER) {
      throw ApiError.badRequest('Cannot demote workspace owner');
    }

    membership.role = role;
    await membership.save();

    await ActivityService.log({
      workspace: req.workspace._id,
      actor: req.user,
      action: 'MEMBER_ROLE_UPDATED',
      entityType: 'MEMBER',
      entityId: membership.user,
      details: { newRole: role },
    });

    return ApiResponse.success(res, { membership }, 'Member role updated successfully');
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const membership = await WorkspaceMember.findById(memberId);

    if (!membership || String(membership.workspace) !== String(req.workspace._id)) {
      throw ApiError.notFound('Member not found in this workspace');
    }

    if (membership.role === ROLES.OWNER) {
      throw ApiError.badRequest('Cannot remove workspace owner');
    }

    await WorkspaceMember.findByIdAndDelete(memberId);

    await ActivityService.log({
      workspace: req.workspace._id,
      actor: req.user,
      action: 'MEMBER_REMOVED',
      entityType: 'MEMBER',
      entityId: membership.user,
    });

    return ApiResponse.success(res, null, 'Member removed from workspace');
  } catch (error) {
    next(error);
  }
};

export const leaveWorkspace = async (req, res, next) => {
  try {
    if (req.userRole === ROLES.OWNER) {
      throw ApiError.badRequest('Owner cannot leave workspace. Transfer ownership or delete workspace.');
    }

    await WorkspaceMember.findOneAndDelete({
      workspace: req.workspace._id,
      user: req.user._id,
    });

    return ApiResponse.success(res, null, 'You have left the workspace');
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceDashboard = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const cacheKey = `workspace:${workspaceId}:dashboard`;

    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData);
    }

    const now = new Date();

    const [
      projectCount,
      memberCount,
      totalTasks,
      completedTasks,
      overdueTasks,
      recentProjects,
      recentActivity,
    ] = await Promise.all([
      Project.countDocuments({ workspace: workspaceId, isArchived: false }),
      WorkspaceMember.countDocuments({ workspace: workspaceId, status: 'active' }),
      Task.countDocuments({ workspace: workspaceId }),
      Task.countDocuments({ workspace: workspaceId, status: 'Done' }),
      Task.countDocuments({ workspace: workspaceId, status: { $ne: 'Done' }, dueDate: { $lt: now } }),
      Project.find({ workspace: workspaceId, isArchived: false })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('createdBy', 'name email avatar'),
      ActivityLog.find({ workspace: workspaceId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('actor', 'name email avatar'),
    ]);

    const activeTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const data = {
      projectCount,
      memberCount,
      totalTasks,
      activeTasks,
      completedTasks,
      overdueTasks,
      completionPercentage,
      recentProjects,
      recentActivity,
    };

    // Cache dashboard for 60 seconds
    await CacheService.set(cacheKey, data, 60);

    return ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
};

