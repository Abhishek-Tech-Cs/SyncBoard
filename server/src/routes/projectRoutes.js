import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../constants/roles.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema } from '../validators/index.js';

const router = express.Router();

router.use(authenticate);
router.use(requireWorkspace);

router.post('/', requirePermission(PERMISSIONS.PROJECT_CREATE), validate(createProjectSchema), createProject);
router.get('/', requirePermission(PERMISSIONS.PROJECT_VIEW), getProjects);
router.get('/:projectId', requirePermission(PERMISSIONS.PROJECT_VIEW), getProjectById);
router.put('/:projectId', requirePermission(PERMISSIONS.PROJECT_UPDATE), updateProject);
router.delete('/:projectId', requirePermission(PERMISSIONS.PROJECT_DELETE), deleteProject);

// Project member management
router.post('/:projectId/members', requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS), addProjectMember);
router.delete('/:projectId/members/:userId', requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS), removeProjectMember);

export default router;

