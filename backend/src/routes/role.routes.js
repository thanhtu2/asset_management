import express from 'express';
import { getAllRoles, getRolePermissions, updateRolePermissions, createRole } from '../controllers/role.controller.js';

const router = express.Router();

router.get('/', getAllRoles);
router.post('/', createRole);
router.get('/:roleCode/permissions', getRolePermissions);
router.post('/:roleCode/permissions', updateRolePermissions);

export default router;