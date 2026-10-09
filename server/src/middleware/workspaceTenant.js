import { ApiError } from '../utils/errors.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';

export const requireWorkspace = async (req, res, next) => {
  try {
    const workspaceId =
      req.params.workspaceId ||
      req.headers['x-workspace-id'] ||
      req.query.workspaceId ||
      req.body.workspaceId;

    if (!workspaceId) {
      throw ApiError.badRequest('Workspace ID is required in params, body, or x-workspace-id header');
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || workspace.isDeleted) {
      throw ApiError.notFound('Workspace not found or has been deactivated');
    }

    // Verify user membership in this workspace
    const membership = await WorkspaceMember.findOne({
      workspace: workspace._id,
      user: req.user._id,
      status: 'active',
    });

    if (!membership) {
      throw ApiError.forbidden('Access denied: You are not an active member of this workspace');
    }

    req.workspace = workspace;
    req.membership = membership;
    req.userRole = membership.role;

    next();
  } catch (error) {
    next(error);
  }
};

