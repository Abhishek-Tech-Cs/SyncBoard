import express from 'express';
import {
  createInvitation,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  revokeInvitation,
} from '../controllers/invitationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspaceTenant.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../constants/roles.js';
import { validate } from '../middleware/validate.js';
import { inviteMemberSchema } from '../validators/index.js';

const router = express.Router();

router.use(authenticate);

// Invite member
router.post(
  '/',
  requireWorkspace,
  requirePermission(PERMISSIONS.WORKSPACE_INVITE_MEMBER),
  validate(inviteMemberSchema),
  createInvitation
);

// Pending invitations list
router.get('/pending', requireWorkspace, getPendingInvitations);

// Accept invitation
router.post('/:token/accept', acceptInvitation);

// Decline invitation
router.post('/:token/decline', declineInvitation);

// Revoke invitation
router.delete('/:id', requireWorkspace, requirePermission(PERMISSIONS.WORKSPACE_INVITE_MEMBER), revokeInvitation);

export default router;

