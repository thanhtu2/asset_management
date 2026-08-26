import express from 'express';
import { getAll } from '../controllers/auditLog.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, checkPermission('MANAGE_USERS'), getAll);

export default router;