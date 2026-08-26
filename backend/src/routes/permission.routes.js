import express from 'express';
import { getAllPermissions, createPermission } from '../controllers/permission.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', getAllPermissions);
router.post('/', checkPermission('MANAGE_ROLES'), createPermission);

export default router;