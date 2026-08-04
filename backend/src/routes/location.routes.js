import express from 'express';
import { getAll, getAllSimple, getById, create, update, remove } from '../controllers/location.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// Đưa API danh sách (dropdown) lên trước để Public quét QR có thể gọi được
router.get('/all', getAllSimple);

// Các API phía dưới đều yêu cầu Auth
router.use(authMiddleware);

router.get('/', checkPermission('VIEW_LOCATIONS'), getAll);
router.get('/:id', checkPermission('VIEW_LOCATIONS'), getById);
router.post('/', checkPermission('CREATE_LOCATION'), create);
router.put('/:id', checkPermission('EDIT_LOCATION'), update);
router.delete('/:id', checkPermission('DELETE_LOCATION'), remove);

export default router;
