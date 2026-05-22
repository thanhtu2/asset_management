import express from 'express';
import { getAll, getAllSimple, getById, create, update, remove } from '../controllers/category.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// Đưa API danh sách (dropdown) lên trước để Public quét QR có thể gọi được
router.get('/all', getAllSimple);

// Các API phía dưới đều yêu cầu Auth
router.use(authMiddleware);

router.get('/', checkPermission('VIEW_CATEGORIES'), getAll);
router.get('/:id', checkPermission('VIEW_CATEGORIES'), getById);
router.post('/', checkPermission('CREATE_CATEGORY'), create);
router.put('/:id', checkPermission('EDIT_CATEGORY'), update);
router.delete('/:id', checkPermission('DELETE_CATEGORY'), remove);

export default router;
