import express from 'express';
import {
  createChannel,
  getWorkspaceChannels,
  getOrCreateDirectChannel,
} from '../controllers/channelController.js';
import {
  sendMessage,
  getChannelMessages,
  editMessage,
  deleteMessage,
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);
router.use(requireWorkspace);

router.post('/', requirePermission(PERMISSIONS.CHANNEL_CREATE), createChannel);
router.get('/', getWorkspaceChannels);
router.post('/direct', getOrCreateDirectChannel);

// Messages inside channel
router.get('/:channelId/messages', getChannelMessages);
router.post('/:channelId/messages', requirePermission(PERMISSIONS.MESSAGE_SEND), sendMessage);
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);

export default router;

