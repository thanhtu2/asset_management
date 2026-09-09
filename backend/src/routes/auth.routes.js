import express from 'express';
import { login, getProfile, changePassword, updateProfile } from '../controllers/auth.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, changePassword);

export default router;
