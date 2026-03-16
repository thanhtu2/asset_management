import express from 'express';
import { getAll, getAllSimple, getById, create, update, remove } from '../controllers/department.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/simple', getAllSimple);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
