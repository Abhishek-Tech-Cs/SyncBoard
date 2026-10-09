import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { CacheService } from '../services/cacheService.js';

export const getWorkspaceAnalytics = async (req, res, next) => {
  try {
    const workspaceId = new mongoose.Types.ObjectId(req.workspace._id);
    const { projectId } = req.query;

    const cacheKey = `analytics:ws:${workspaceId}:${projectId || 'all'}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return ApiResponse.success(res, cached);
    }

    const matchQuery = { workspace: workspaceId };
    if (projectId) {
      matchQuery.project = new mongoose.Types.ObjectId(projectId);
    }

    const now = new Date();

    // 1. Core Summary Metrics
    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      inProgressTasks,
      tasksByStatusRaw,
      tasksByPriorityRaw,
      tasksByMemberRaw,
      completionTrendRaw,
    ] = await Promise.all([
      Task.countDocuments(matchQuery),
      Task.countDocuments({ ...matchQuery, status: 'Done' }),
      Task.countDocuments({ ...matchQuery, status: { $ne: 'Done' }, dueDate: { $lt: now } }),
      Task.countDocuments({ ...matchQuery, status: 'In Progress' }),

      // Aggregation: Tasks by Status
      Task.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Aggregation: Tasks by Priority
      Task.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      // Aggregation: Tasks by Assignee
      Task.aggregate([
        { $match: matchQuery },
        { $unwind: { path: '$assignees', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: '$assignees',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            name: '$user.name',
            avatar: '$user.avatar',
            total: 1,
            completed: 1,
            pending: { $subtract: ['$total', '$completed'] },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),

      // Aggregation: Productivity Trend (last 14 days)
      Task.aggregate([
        {
          $match: {
            ...matchQuery,
            createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            created: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const pendingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Normalize Status Counts
    const statusMap = { Backlog: 0, Todo: 0, 'In Progress': 0, Review: 0, Done: 0 };
    tasksByStatusRaw.forEach((item) => {
      if (item._id) statusMap[item._id] = item.count;
    });
    const tasksByStatus = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));

    // Normalize Priority Counts
    const priorityMap = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    tasksByPriorityRaw.forEach((item) => {
      if (item._id) priorityMap[item._id] = item.count;
    });
    const tasksByPriority = Object.entries(priorityMap).map(([priority, count]) => ({
      priority,
      count,
    }));

    const result = {
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        inProgressTasks,
        completionPercentage,
      },
      tasksByStatus,
      tasksByPriority,
      tasksByMember: tasksByMemberRaw,
      productivityTrend: completionTrendRaw.map((t) => ({
        date: t._id,
        created: t.created,
        completed: t.completed,
      })),
    };

    // Cache analytics for 30 seconds
    await CacheService.set(cacheKey, result, 30);

    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

