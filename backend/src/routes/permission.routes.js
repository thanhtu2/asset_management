import express from 'express';
import { getAllPermissions, createPermission } from '../controllers/permission.controller.js';

const router = express.Router();

router.get('/', getAllPermissions);
router.post('/', createPermission);

export default router;