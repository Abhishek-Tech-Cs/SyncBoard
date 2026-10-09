import express from 'express';
import { getWorkspaceAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);
router.use(requireWorkspace);

router.get('/', requirePermission(PERMISSIONS.ANALYTICS_VIEW), getWorkspaceAnalytics);

export default router;

