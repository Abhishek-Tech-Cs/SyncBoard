import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Comment } from '../models/Comment.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const globalSearch = async (req, res, next) => {
  try {
    const {
      q = '',
      type = 'all', // 'all' | 'tasks' | 'projects' | 'comments' | 'members'
      projectId,
      status,
      priority,
      assignee,
      limit = 20,
    } = req.query;

    const workspaceId = req.workspace._id;
    const searchRegex = q.trim() ? new RegExp(q.trim(), 'i') : null;

    let tasks = [];
    let projects = [];
    let comments = [];
    let members = [];

    // Search Tasks
    if (type === 'all' || type === 'tasks') {
      const taskQuery = { workspace: workspaceId };

      if (searchRegex) {
        taskQuery.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { taskKey: searchRegex },
        ];
      }
      if (projectId) taskQuery.project = projectId;
      if (status) taskQuery.status = status;
      if (priority) taskQuery.priority = priority;
      if (assignee) taskQuery.assignees = assignee;

      tasks = await Task.find(taskQuery)
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit, 10))
        .populate('assignees', 'name email avatar')
        .populate('project', 'name key');
    }

    // Search Projects
    if ((type === 'all' || type === 'projects') && (!status && !priority && !assignee)) {
      const projectQuery = { workspace: workspaceId, isArchived: false };
      if (searchRegex) {
        projectQuery.$or = [
          { name: searchRegex },
          { key: searchRegex },
          { description: searchRegex },
        ];
      }
      projects = await Project.find(projectQuery)
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('createdBy', 'name email avatar');
    }

    // Search Comments
    if (type === 'all' || type === 'comments') {
      if (searchRegex) {
        const commentQuery = { workspace: workspaceId, content: searchRegex };
        if (projectId) commentQuery.project = projectId;

        comments = await Comment.find(commentQuery)
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('author', 'name email avatar')
          .populate('task', 'title taskKey project');
      }
    }

    // Search Workspace Members
    if (type === 'all' || type === 'members') {
      const memberQuery = { workspace: workspaceId, status: 'active' };
      members = await WorkspaceMember.find(memberQuery)
        .populate({
          path: 'user',
          match: searchRegex ? { $or: [{ name: searchRegex }, { email: searchRegex }] } : {},
          select: 'name email avatar status bio',
        });
      members = members.filter((m) => m.user);
    }

    return ApiResponse.success(res, {
      results: {
        tasks,
        projects,
        comments,
        members,
      },
      counts: {
        tasks: tasks.length,
        projects: projects.length,
        comments: comments.length,
        members: members.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

