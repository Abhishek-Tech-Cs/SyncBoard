import { Message } from '../models/Message.js';
import { Channel } from '../models/Channel.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { NotificationService } from '../services/notificationService.js';
import { getSocketIO } from '../sockets/socketServer.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { content, mentions = [] } = req.body;

    if (!content || !content.trim()) {
      throw ApiError.badRequest('Message content cannot be empty');
    }

    const channel = await Channel.findOne({
      _id: channelId,
      workspace: req.workspace._id,
    });

    if (!channel) {
      throw ApiError.notFound('Channel not found in this workspace');
    }

    // Check membership if private or direct
    if (channel.type !== 'public' && !channel.members.some((m) => String(m) === String(req.user._id))) {
      throw ApiError.forbidden('You are not a member of this private channel');
    }

    const message = await Message.create({
      channel: channelId,
      workspace: req.workspace._id,
      sender: req.user._id,
      content: content.trim(),
      mentions,
      readBy: [req.user._id],
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar status')
      .populate('mentions', 'name email');

    // Handle mentions notifications
    if (mentions.length > 0) {
      await NotificationService.createMany(mentions, {
        sender: req.user._id,
        workspace: req.workspace._id,
        type: 'MENTION',
        title: 'Mentioned in Chat',
        message: `${req.user.name} mentioned you in #${channel.name}`,
        link: `/chat?channel=${channelId}`,
        data: { channelId, messageId: message._id },
      });
    }

    // Real-time broadcast to channel room
    const io = getSocketIO();
    if (io) {
      io.to(`channel:${channelId}`).emit(SOCKET_EVENTS.MESSAGE_SENT, populatedMessage);
    }

    return ApiResponse.created(res, { message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;

    const query = {
      channel: channelId,
      workspace: req.workspace._id,
      deleted: false,
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate('sender', 'name email avatar status')
      .populate('mentions', 'name email');

    return ApiResponse.success(res, { messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      throw ApiError.badRequest('Content cannot be empty');
    }

    const message = await Message.findById(messageId);
    if (!message) throw ApiError.notFound('Message not found');

    if (String(message.sender) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only edit your own messages');
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email avatar status');

    const io = getSocketIO();
    if (io) {
      io.to(`channel:${message.channel}`).emit(SOCKET_EVENTS.MESSAGE_UPDATED, populatedMessage);
    }

    return ApiResponse.success(res, { message: populatedMessage }, 'Message updated');
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) throw ApiError.notFound('Message not found');

    if (String(message.sender) !== String(req.user._id) && req.userRole !== 'OWNER' && req.userRole !== 'ADMIN') {
      throw ApiError.forbidden('Permission denied');
    }

    message.deleted = true;
    message.content = 'This message was deleted';
    await message.save();

    const io = getSocketIO();
    if (io) {
      io.to(`channel:${message.channel}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
        messageId: message._id,
        channelId: message.channel,
      });
    }

    return ApiResponse.success(res, null, 'Message deleted');
  } catch (error) {
    next(error);
  }
};

