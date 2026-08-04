import express from 'express';
import { getAll, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Tất cả API thông báo đều cần đăng nhập
router.use(authMiddleware);

router.get('/', getAll);
router.put('/read-all', markAllAsRead); // Endpoint tiện ích nếu sau này bạn cần nút "Đánh dấu tất cả đã đọc"
router.put('/:id/read', markAsRead);

export default router;