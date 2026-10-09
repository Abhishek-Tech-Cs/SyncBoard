import { Comment } from '../models/Comment.js';
import { Task } from '../models/Task.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { NotificationService } from '../services/notificationService.js';
import { ActivityService } from '../services/activityService.js';
import { getSocketIO } from '../sockets/socketServer.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content, mentions = [] } = req.body;

    if (!content || !content.trim()) {
      throw ApiError.badRequest('Comment content cannot be empty');
    }

    const task = await Task.findOne({ _id: taskId, workspace: req.workspace._id });
    if (!task) throw ApiError.notFound('Task not found');

    const comment = await Comment.create({
      workspace: req.workspace._id,
      project: task.project,
      task: taskId,
      author: req.user._id,
      content: content.trim(),
      mentions,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email');

    // Notify mentioned users
    if (mentions.length > 0) {
      await NotificationService.createMany(mentions, {
        sender: req.user._id,
        workspace: req.workspace._id,
        type: 'MENTION',
        title: 'Mentioned in Comment',
        message: `${req.user.name} mentioned you in a comment on '${task.title}'`,
        link: `/projects/${task.project}?task=${task._id}`,
        data: { taskId: task._id, commentId: comment._id },
      });
    }

    // Notify task assignees
    const notifyAssignees = (task.assignees || []).filter(
      (aId) => !mentions.includes(String(aId)) && String(aId) !== String(req.user._id)
    );
    if (notifyAssignees.length > 0) {
      await NotificationService.createMany(notifyAssignees, {
        sender: req.user._id,
        workspace: req.workspace._id,
        type: 'COMMENT_ADDED',
        title: 'New Comment on Task',
        message: `${req.user.name} commented on '${task.title}'`,
        link: `/projects/${task.project}?task=${task._id}`,
        data: { taskId: task._id },
      });
    }

    await ActivityService.log({
      workspace: req.workspace._id,
      project: task.project,
      task: task._id,
      actor: req.user,
      action: 'COMMENT_ADDED',
      entityType: 'COMMENT',
      entityId: comment._id,
      details: { taskTitle: task.title },
    });

    // Real-time socket broadcast
    const io = getSocketIO();
    if (io) {
      io.to(`project:${task.project}`).emit(SOCKET_EVENTS.COMMENT_ADDED, {
        taskId: task._id,
        comment: populatedComment,
      });
    }

    return ApiResponse.created(res, { comment: populatedComment });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .sort({ createdAt: 1 })
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email');

    return ApiResponse.success(res, { comments });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) throw ApiError.notFound('Comment not found');

    if (String(comment.author) !== String(req.user._id) && req.userRole !== 'OWNER' && req.userRole !== 'ADMIN') {
      throw ApiError.forbidden('You can only delete your own comments');
    }

    await Comment.findByIdAndDelete(commentId);

    const io = getSocketIO();
    if (io) {
      io.to(`project:${comment.project}`).emit(SOCKET_EVENTS.COMMENT_DELETED, {
        taskId: comment.task,
        commentId,
      });
    }

    return ApiResponse.success(res, null, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};

