import express from 'express';
import { getAll, getAllSimple, getById, create, update, remove } from '../controllers/department.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Đưa API danh sách (dropdown) lên trước để Public quét QR có thể gọi được
router.get('/simple', getAllSimple);

// Các API phía dưới đều yêu cầu Auth
router.use(authMiddleware);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
