import express from 'express';
import { getAll, getAllSimple, getById, create, update, remove } from '../controllers/department.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// Đưa API danh sách (dropdown) lên trước để Public quét QR có thể gọi được
router.get('/simple', getAllSimple);

// Các API phía dưới đều yêu cầu Auth
router.use(authMiddleware);

router.get('/', checkPermission('VIEW_DEPARTMENTS'), getAll);
router.get('/:id', checkPermission('VIEW_DEPARTMENTS'), getById);
router.post('/', checkPermission('CREATE_DEPARTMENT'), create);
router.put('/:id', checkPermission('EDIT_DEPARTMENT'), update);
router.delete('/:id', checkPermission('DELETE_DEPARTMENT'), remove);

export default router;
