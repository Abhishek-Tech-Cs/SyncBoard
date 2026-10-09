import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { Task } from '../models/Task.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ActivityService } from '../services/activityService.js';
import { CacheService } from '../services/cacheService.js';
import { NotificationService } from '../services/notificationService.js';

export const createProject = async (req, res, next) => {
  try {
    const { name, key, description, status, priority, startDate, dueDate, labels } = req.body;
    const workspaceId = req.workspace._id;

    // Check duplicate key in this workspace
    const existingKey = await Project.findOne({ workspace: workspaceId, key: key.toUpperCase() });
    if (existingKey) {
      throw ApiError.conflict(`A project with key '${key.toUpperCase()}' already exists in this workspace`);
    }

    const defaultLabels = labels || [
      { id: '1', name: 'Bug', color: '#ef4444' },
      { id: '2', name: 'Feature', color: '#3b82f6' },
      { id: '3', name: 'Enhancement', color: '#10b981' },
      { id: '4', name: 'Design', color: '#a855f7' },
      { id: '5', name: 'Docs', color: '#f59e0b' },
    ];

    const project = await Project.create({
      workspace: workspaceId,
      name,
      key: key.toUpperCase(),
      description,
      status: status || 'IN_PROGRESS',
      priority: priority || 'MEDIUM',
      startDate: startDate || null,
      dueDate: dueDate || null,
      createdBy: req.user._id,
      labels: defaultLabels,
    });

    // Add creator as LEAD member
    await ProjectMember.create({
      project: project._id,
      workspace: workspaceId,
      user: req.user._id,
      role: 'LEAD',
    });

    await ActivityService.log({
      workspace: workspaceId,
      project: project._id,
      actor: req.user,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project._id,
      details: { name: project.name, key: project.key },
    });

    await CacheService.del(`workspace:${workspaceId}:dashboard`);

    return ApiResponse.created(res, { project }, 'Project created successfully');
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const { status, search } = req.query;

    const filter = {
      workspace: workspaceId,
      isArchived: false,
    };

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { key: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(filter)
      .sort({ updatedAt: -1 })
      .populate('createdBy', 'name email avatar');

    // Attach task counts to each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const [totalTasks, completedTasks] = await Promise.all([
          Task.countDocuments({ project: p._id }),
          Task.countDocuments({ project: p._id, status: 'Done' }),
        ]);
        return {
          ...p.toObject(),
          totalTasks,
          completedTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        };
      })
    );

    return ApiResponse.success(res, { projects: projectsWithCounts });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const cacheKey = `project:${projectId}:meta`;

    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return ApiResponse.success(res, cached);
    }

    const project = await Project.findOne({
      _id: projectId,
      workspace: req.workspace._id,
    }).populate('createdBy', 'name email avatar');

    if (!project) {
      throw ApiError.notFound('Project not found in this workspace');
    }

    const members = await ProjectMember.find({ project: project._id })
      .populate('user', 'name email avatar status');

    const [totalTasks, completedTasks, inProgressTasks, backlogTasks] = await Promise.all([
      Task.countDocuments({ project: project._id }),
      Task.countDocuments({ project: project._id, status: 'Done' }),
      Task.countDocuments({ project: project._id, status: 'In Progress' }),
      Task.countDocuments({ project: project._id, status: 'Backlog' }),
    ]);

    const result = {
      project,
      members,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        backlogTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    };

    await CacheService.set(cacheKey, result, 60);

    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, status, priority, startDate, dueDate, labels } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      workspace: req.workspace._id,
    });

    if (!project) {
      throw ApiError.notFound('Project not found in this workspace');
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (labels) project.labels = labels;

    await project.save();

    await CacheService.del(`project:${projectId}:meta`);
    await CacheService.del(`workspace:${req.workspace._id}:dashboard`);

    await ActivityService.log({
      workspace: req.workspace._id,
      project: project._id,
      actor: req.user,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: project._id,
    });

    return ApiResponse.success(res, { project }, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      workspace: req.workspace._id,
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    project.isArchived = true;
    await project.save();

    await CacheService.del(`project:${projectId}:meta`);
    await CacheService.del(`workspace:${req.workspace._id}:dashboard`);

    return ApiResponse.success(res, null, 'Project archived successfully');
  } catch (error) {
    next(error);
  }
};

export const addProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { userId, role = 'MEMBER' } = req.body;

    const project = await Project.findOne({ _id: projectId, workspace: req.workspace._id });
    if (!project) throw ApiError.notFound('Project not found');

    const existing = await ProjectMember.findOne({ project: projectId, user: userId });
    if (existing) {
      existing.role = role;
      await existing.save();
      return ApiResponse.success(res, { member: existing }, 'Member role updated');
    }

    const member = await ProjectMember.create({
      project: projectId,
      workspace: req.workspace._id,
      user: userId,
      role,
    });

    await NotificationService.create({
      recipient: userId,
      sender: req.user._id,
      workspace: req.workspace._id,
      type: 'PROJECT_ADDED',
      title: 'Added to Project',
      message: `${req.user.name} added you to project '${project.name}'`,
      link: `/projects/${projectId}`,
    });

    await CacheService.del(`project:${projectId}:meta`);

    return ApiResponse.created(res, { member }, 'Member added to project');
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    await ProjectMember.findOneAndDelete({ project: projectId, user: userId });
    await CacheService.del(`project:${projectId}:meta`);
    return ApiResponse.success(res, null, 'Member removed from project');
  } catch (error) {
    next(error);
  }
};

