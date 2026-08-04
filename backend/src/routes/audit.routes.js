import express from 'express';
import { getAll } from '../controllers/auditLog.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, getAll);

export default router;