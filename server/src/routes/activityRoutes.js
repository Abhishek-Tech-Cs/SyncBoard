import express from 'express';
import { getActivityLogs } from '../controllers/activityController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';

const router = express.Router();

router.use(authenticate);
router.use(requireWorkspace);

router.get('/', getActivityLogs);

export default router;

