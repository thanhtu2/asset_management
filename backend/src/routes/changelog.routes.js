import express from 'express';
import {
  getChangelogs,
  createChangelog,
  updateChangelog,
  deleteChangelog
} from '../controllers/changelog.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getChangelogs);
router.post('/', authMiddleware, checkPermission('MANAGE_USERS'), createChangelog);
router.put('/:id', authMiddleware, checkPermission('MANAGE_USERS'), updateChangelog);
router.delete('/:id', authMiddleware, checkPermission('MANAGE_USERS'), deleteChangelog);

export default router;
