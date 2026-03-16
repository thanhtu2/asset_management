import express from 'express';
import { getAll, getById, create, update, remove, exportUsers } from '../controllers/user.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/export', exportUsers);
router.get('/:id', getById);
router.post('/', adminMiddleware, create);
router.put('/:id', update);
router.delete('/:id', adminMiddleware, remove);

export default router;
