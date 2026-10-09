import { Channel } from '../models/Channel.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { getSocketIO } from '../sockets/socketServer.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const createChannel = async (req, res, next) => {
  try {
    const { name, topic = '', type = 'public', members = [] } = req.body;
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const existing = await Channel.findOne({
      workspace: req.workspace._id,
      name: cleanName,
      type: { $ne: 'direct' },
    });

    if (existing) {
      throw ApiError.conflict(`Channel #${cleanName} already exists`);
    }

    const channelMembers = Array.from(new Set([String(req.user._id), ...members.map(String)]));

    const channel = await Channel.create({
      workspace: req.workspace._id,
      name: cleanName,
      topic,
      type,
      members: channelMembers,
      createdBy: req.user._id,
    });

    const populated = await Channel.findById(channel._id).populate('members', 'name email avatar status');

    const io = getSocketIO();
    if (io) {
      io.to(`workspace:${req.workspace._id}`).emit(SOCKET_EVENTS.NEW_CHANNEL, populated);
    }

    return ApiResponse.created(res, { channel: populated }, 'Channel created successfully');
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceChannels = async (req, res, next) => {
  try {
    const channels = await Channel.find({
      workspace: req.workspace._id,
      $or: [
        { type: 'public' },
        { members: req.user._id },
      ],
    })
      .sort({ type: 1, name: 1 })
      .populate('members', 'name email avatar status');

    return ApiResponse.success(res, { channels });
  } catch (error) {
    next(error);
  }
};

/**
 * Get or create direct message channel between current user and target user
 */
export const getOrCreateDirectChannel = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId || String(targetUserId) === String(req.user._id)) {
      throw ApiError.badRequest('Invalid target user for direct message');
    }

    // Verify target user is in this workspace
    const targetMember = await WorkspaceMember.findOne({
      workspace: req.workspace._id,
      user: targetUserId,
      status: 'active',
    });

    if (!targetMember) {
      throw ApiError.notFound('User is not a member of this workspace');
    }

    let channel = await Channel.findOne({
      workspace: req.workspace._id,
      type: 'direct',
      members: { $all: [req.user._id, targetUserId], $size: 2 },
    }).populate('members', 'name email avatar status');

    if (!channel) {
      channel = await Channel.create({
        workspace: req.workspace._id,
        name: `dm-${Date.now()}`,
        type: 'direct',
        members: [req.user._id, targetUserId],
        createdBy: req.user._id,
      });

      channel = await Channel.findById(channel._id).populate('members', 'name email avatar status');
    }

    return ApiResponse.success(res, { channel });
  } catch (error) {
    next(error);
  }
};

