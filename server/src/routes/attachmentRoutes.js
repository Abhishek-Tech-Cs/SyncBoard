import express from 'express';
import { uploadAttachment, deleteAttachment } from '../controllers/attachmentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);
router.use(requireWorkspace);

router.post('/upload', upload.single('file'), uploadAttachment);
router.delete('/:id', deleteAttachment);

export default router;

