import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../constants/roles.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema, moveTaskSchema } from '../validators/index.js';

const router = express.Router();

router.use(authenticate);
router.use(requireWorkspace);

router.post('/', requirePermission(PERMISSIONS.TASK_CREATE), validate(createTaskSchema), createTask);
router.get('/', requirePermission(PERMISSIONS.TASK_VIEW), getTasks);
router.get('/:taskId', requirePermission(PERMISSIONS.TASK_VIEW), getTaskById);
router.put('/:taskId', requirePermission(PERMISSIONS.TASK_UPDATE), updateTask);
router.put('/:taskId/move', requirePermission(PERMISSIONS.TASK_MOVE), validate(moveTaskSchema), moveTask);
router.delete('/:taskId', requirePermission(PERMISSIONS.TASK_DELETE), deleteTask);

// Checklist items
router.post('/:taskId/checklist', requirePermission(PERMISSIONS.TASK_UPDATE), addChecklistItem);
router.put('/:taskId/checklist/:itemId', requirePermission(PERMISSIONS.TASK_UPDATE), toggleChecklistItem);
router.delete('/:taskId/checklist/:itemId', requirePermission(PERMISSIONS.TASK_UPDATE), deleteChecklistItem);

export default router;

