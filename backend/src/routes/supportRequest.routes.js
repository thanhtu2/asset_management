import express from 'express';
import { getAll, getById, create, update } from '../controllers/supportRequest.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', checkPermission('VIEW_SUPPORT_REQUESTS'), getAll);
router.get('/:id', checkPermission('VIEW_SUPPORT_REQUESTS'), getById);
router.post('/', checkPermission('CREATE_SUPPORT_REQUEST'), create);
router.put('/:id', checkPermission('PROCESS_SUPPORT_REQUEST'), update);

export default router;
