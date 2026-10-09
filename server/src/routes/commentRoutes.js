import express from 'express';
import { addComment, getComments, deleteComment } from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireWorkspace);

router.post('/tasks/:taskId/comments', requirePermission(PERMISSIONS.TASK_COMMENT), addComment);
router.get('/tasks/:taskId/comments', requirePermission(PERMISSIONS.TASK_VIEW), getComments);
router.delete('/comments/:commentId', deleteComment);

export default router;

