import express from 'express';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  getWorkspaceDashboard,
} from '../controllers/workspaceController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';
import { requireMinRole, requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS, ROLES } from '../constants/roles.js';
import { validate } from '../middleware/validate.js';
import { createWorkspaceSchema } from '../validators/index.js';

const router = express.Router();

router.use(authenticate);

// List and Create
router.get('/', getUserWorkspaces);
router.post('/', validate(createWorkspaceSchema), createWorkspace);

// Specific Workspace operations (requires tenancy check)
router.get('/:workspaceId', requireWorkspace, getWorkspace);
router.put('/:workspaceId', requireWorkspace, requireMinRole(ROLES.ADMIN), updateWorkspace);
router.delete('/:workspaceId', requireWorkspace, requireMinRole(ROLES.OWNER), deleteWorkspace);

// Dashboard metrics
router.get('/:workspaceId/dashboard', requireWorkspace, getWorkspaceDashboard);

// Members & RBAC
router.get('/:workspaceId/members', requireWorkspace, getWorkspaceMembers);
router.put(
  '/:workspaceId/members/:memberId/role',
  requireWorkspace,
  requirePermission(PERMISSIONS.WORKSPACE_UPDATE_ROLE),
  updateMemberRole
);
router.delete(
  '/:workspaceId/members/:memberId',
  requireWorkspace,
  requirePermission(PERMISSIONS.WORKSPACE_REMOVE_MEMBER),
  removeMember
);
router.post('/:workspaceId/leave', requireWorkspace, leaveWorkspace);

export default router;

