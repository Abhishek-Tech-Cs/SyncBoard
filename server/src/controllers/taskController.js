import mongoose from 'mongoose';
import { Task, TASK_STATUSES } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Comment } from '../models/Comment.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ActivityService } from '../services/activityService.js';
import { NotificationService } from '../services/notificationService.js';
import { CacheService } from '../services/cacheService.js';
import { getSocketIO } from '../sockets/socketServer.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const createTask = async (req, res, next) => {
  try {
    const {
      projectId,
      title,
      description = '',
      status = 'Todo',
      priority = 'MEDIUM',
      assignees = [],
      dueDate = null,
      startDate = null,
      labels = [],
      estimatedHours = 0,
    } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      workspace: req.workspace._id,
    });

    if (!project) {
      throw ApiError.notFound('Project not found in this workspace');
    }

    // Atomic increment of project task counter
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $inc: { taskCounter: 1 } },
      { new: true }
    );

    const taskNumber = updatedProject.taskCounter;
    const taskKey = `${project.key}-${taskNumber}`;

    // Get highest order in this status column
    const highestOrderTask = await Task.findOne({ project: projectId, status })
      .sort({ order: -1 })
      .select('order');
    const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = await Task.create({
      workspace: req.workspace._id,
      project: projectId,
      taskNumber,
      taskKey,
      title,
      description,
      status,
      priority,
      order,
      assignees,
      reporter: req.user._id,
      dueDate,
      startDate,
      labels,
      estimatedHours,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Notify assignees
    if (assignees.length > 0) {
      await NotificationService.createMany(assignees, {
        sender: req.user._id,
        workspace: req.workspace._id,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you to '${task.title}' (${taskKey})`,
        link: `/projects/${projectId}?task=${task._id}`,
        data: { taskId: task._id, projectId },
      });
    }

    // Log Activity
    await ActivityService.log({
      workspace: req.workspace._id,
      project: projectId,
      task: task._id,
      actor: req.user,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task._id,
      details: { title: task.title, taskKey, status: task.status },
    });

    // Invalidate caches
    await CacheService.del(`project:${projectId}:meta`);
    await CacheService.del(`workspace:${req.workspace._id}:dashboard`);

    // Real-time socket broadcast to project room
    const io = getSocketIO();
    if (io) {
      io.to(`project:${projectId}`).emit(SOCKET_EVENTS.TASK_CREATED, populatedTask);
    }

    return ApiResponse.created(res, { task: populatedTask }, 'Task created successfully');
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, assignee, search } = req.query;

    const filter = {
      workspace: req.workspace._id,
    };

    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignees = assignee;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { taskKey: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('attachments');

    return ApiResponse.success(res, { tasks });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      workspace: req.workspace._id,
    })
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('attachments')
      .populate('project', 'name key');

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const comments = await Comment.find({ task: taskId })
      .sort({ createdAt: 1 })
      .populate('author', 'name email avatar');

    return ApiResponse.success(res, { task, comments });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assignees,
      dueDate,
      startDate,
      labels,
      estimatedHours,
      actualHours,
    } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      workspace: req.workspace._id,
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const prevStatus = task.status;
    const prevPriority = task.priority;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignees !== undefined) task.assignees = assignees;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (startDate !== undefined) task.startDate = startDate;
    if (labels !== undefined) task.labels = labels;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('attachments');

    // If status changed, notify and log
    if (status && status !== prevStatus) {
      await ActivityService.log({
        workspace: req.workspace._id,
        project: task.project,
        task: task._id,
        actor: req.user,
        action: 'TASK_MOVED',
        entityType: 'TASK',
        entityId: task._id,
        details: { from: prevStatus, to: status, title: task.title },
      });

      if (task.assignees.length > 0) {
        await NotificationService.createMany(task.assignees, {
          sender: req.user._id,
          workspace: req.workspace._id,
          type: 'TASK_STATUS_CHANGED',
          title: 'Task Status Updated',
          message: `${req.user.name} changed status of '${task.title}' to ${status}`,
          link: `/projects/${task.project}?task=${task._id}`,
          data: { taskId: task._id, status },
        });
      }
    } else {
      await ActivityService.log({
        workspace: req.workspace._id,
        project: task.project,
        task: task._id,
        actor: req.user,
        action: 'TASK_UPDATED',
        entityType: 'TASK',
        entityId: task._id,
        details: { title: task.title },
      });
    }

    // Invalidate caches
    await CacheService.del(`project:${task.project}:meta`);
    await CacheService.del(`workspace:${req.workspace._id}:dashboard`);

    // Broadcast real-time update
    const io = getSocketIO();
    if (io) {
      io.to(`project:${task.project}`).emit(SOCKET_EVENTS.TASK_UPDATED, populatedTask);
    }

    return ApiResponse.success(res, { task: populatedTask }, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Real-time Drag-and-Drop Task Movement
 */
export const moveTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status, order } = req.body;

    if (!TASK_STATUSES.includes(status)) {
      throw ApiError.badRequest('Invalid status column');
    }

    const task = await Task.findOne({
      _id: taskId,
      workspace: req.workspace._id,
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const oldStatus = task.status;
    const oldOrder = task.order;

    task.status = status;
    task.order = order;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Invalidate caches
    await CacheService.del(`project:${task.project}:meta`);
    await CacheService.del(`workspace:${req.workspace._id}:dashboard`);

    // Activity log if column changed
    if (oldStatus !== status) {
      await ActivityService.log({
        workspace: req.workspace._id,
        project: task.project,
        task: task._id,
        actor: req.user,
        action: 'TASK_MOVED',
        entityType: 'TASK',
        entityId: task._id,
        details: { from: oldStatus, to: status, title: task.title },
      });
    }

    // Real-time broadcast to all clients in the project room
    const io = getSocketIO();
    if (io) {
      io.to(`project:${task.project}`).emit(SOCKET_EVENTS.TASK_MOVED, {
        taskId: task._id,
        status,
        order,
        task: populatedTask,
      });
    }

    return ApiResponse.success(res, { task: populatedTask }, 'Task moved successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOneAndDelete({
      _id: taskId,
      workspace: req.workspace._id,
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Remove comments
    await Comment.deleteMany({ task: taskId });

    await ActivityService.log({
      workspace: req.workspace._id,
      project: task.project,
      task: task._id,
      actor: req.user,
      action: 'TASK_DELETED',
      entityType: 'TASK',
      entityId: task._id,
      details: { title: task.title, taskKey: task.taskKey },
    });

    // Invalidate caches
    await CacheService.del(`project:${task.project}:meta`);
    await CacheService.del(`workspace:${req.workspace._id}:dashboard`);

    // Broadcast deletion
    const io = getSocketIO();
    if (io) {
      io.to(`project:${task.project}`).emit(SOCKET_EVENTS.TASK_DELETED, {
        taskId: task._id,
        projectId: task.project,
      });
    }

    return ApiResponse.success(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Checklist management
export const addChecklistItem = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      throw ApiError.badRequest('Checklist text is required');
    }

    const task = await Task.findOne({ _id: taskId, workspace: req.workspace._id });
    if (!task) throw ApiError.notFound('Task not found');

    task.checklist.push({ text: text.trim(), completed: false });
    await task.save();

    const io = getSocketIO();
    if (io) {
      io.to(`project:${task.project}`).emit(SOCKET_EVENTS.TASK_UPDATED, task);
    }

    return ApiResponse.created(res, { checklist: task.checklist });
  } catch (error) {
    next(error);
  }
};

export const toggleChecklistItem = async (req, res, next) => {
  try {
    const { taskId, itemId } = req.params;
    const { completed, text } = req.body;

    const task = await Task.findOne({ _id: taskId, workspace: req.workspace._id });
    if (!task) throw ApiError.notFound('Task not found');

    const item = task.checklist.id(itemId);
    if (!item) throw ApiError.notFound('Checklist item not found');

    if (completed !== undefined) {
      item.completed = completed;
      item.completedAt = completed ? new Date() : null;
    }
    if (text !== undefined) item.text = text;

    await task.save();

    const io = getSocketIO();
    if (io) {
      io.to(`project:${task.project}`).emit(SOCKET_EVENTS.TASK_UPDATED, task);
    }

    return ApiResponse.success(res, { checklist: task.checklist });
  } catch (error) {
    next(error);
  }
};

export const deleteChecklistItem = async (req, res, next) => {
  try {
    const { taskId, itemId } = req.params;

    const task = await Task.findOne({ _id: taskId, workspace: req.workspace._id });
    if (!task) throw ApiError.notFound('Task not found');

    task.checklist.pull({ _id: itemId });
    await task.save();

    const io = getSocketIO();
    if (io) {
      io.to(`project:${task.project}`).emit(SOCKET_EVENTS.TASK_UPDATED, task);
    }

    return ApiResponse.success(res, { checklist: task.checklist });
  } catch (error) {
    next(error);
  }
};

