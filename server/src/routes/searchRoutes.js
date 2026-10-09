import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';

const router = express.Router();

router.use(authenticate);
router.use(requireWorkspace);

router.get('/', globalSearch);

export default router;

