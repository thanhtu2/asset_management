import express from 'express';
import { getAll, getById, create, update } from '../controllers/supportRequest.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);

const canUpdateSupportRequest = (req, res, next) => {
  const hasProcessPermission = req.user?.role === 'admin' || req.user?.permissions?.includes('PROCESS_SUPPORT_REQUEST');
  const requestedStatus = req.body?.status;

  if (hasProcessPermission || requestedStatus === 'closed' || requestedStatus === 'resolved' || requestedStatus === 'waiting_user') {
    return next();
  }

  return res.status(403).json({ message: 'Từ chối truy cập. Bạn không có quyền cập nhật phiếu hỗ trợ.' });
};

router.get('/', checkPermission('VIEW_SUPPORT_REQUESTS'), getAll);
router.get('/:id', checkPermission('VIEW_SUPPORT_REQUESTS'), getById);
router.post('/', checkPermission('CREATE_SUPPORT_REQUEST'), create);
router.put('/:id', canUpdateSupportRequest, update);

export default router;
