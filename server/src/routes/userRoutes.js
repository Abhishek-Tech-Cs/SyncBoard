import express from 'express';
import { searchUsers, getUserById } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/:id', getUserById);

export default router;

