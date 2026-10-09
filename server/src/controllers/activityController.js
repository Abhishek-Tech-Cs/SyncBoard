import { ActivityLog } from '../models/ActivityLog.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getActivityLogs = async (req, res, next) => {
  try {
    const { projectId, taskId, limit = 50, page = 1 } = req.query;

    const query = {
      workspace: req.workspace._id,
    };

    if (projectId) query.project = projectId;
    if (taskId) query.task = taskId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('actor', 'name email avatar')
        .populate('project', 'name key')
        .populate('task', 'title taskKey'),
      ActivityLog.countDocuments(query),
    ]);

    return ApiResponse.success(res, {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

