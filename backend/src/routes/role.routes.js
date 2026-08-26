import express from 'express';
import { getAllRoles, getRolePermissions, updateRolePermissions, createRole } from '../controllers/role.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', getAllRoles);
router.post('/', checkPermission('MANAGE_ROLES'), createRole);
router.get('/:roleCode/permissions', checkPermission('MANAGE_ROLES'), getRolePermissions);
router.post('/:roleCode/permissions', checkPermission('MANAGE_ROLES'), updateRolePermissions);

export default router;