import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getSystemStatus } from '../controllers/system.controller.js';

const router = express.Router();
router.get('/status', authMiddleware, getSystemStatus);

export default router;