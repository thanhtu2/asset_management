import express from 'express';
import { getAll, getAllSimple, getById, create, update, remove, exportUsers } from '../controllers/user.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkPermission('MANAGE_USERS'), getAll);
router.get('/export', checkPermission('MANAGE_USERS'), exportUsers);
router.get('/simple', getAllSimple);
router.get('/:id', getById);
router.post('/', checkPermission('MANAGE_USERS'), create);
router.put('/:id', checkPermission('MANAGE_USERS'), update);
router.delete('/:id', checkPermission('MANAGE_USERS'), remove);

export default router;
