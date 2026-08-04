import express from 'express';
import pool from '../config/database.js';
import { 
  getAll, getById, create, update, remove, getStats 
} from '../controllers/purchaseProposal.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';
import { generalUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkPermission('VIEW_PURCHASE_PROPOSALS'), getAll);
router.get('/stats', checkPermission('VIEW_PURCHASE_PROPOSALS'), getStats);
router.get('/:id', checkPermission('VIEW_PURCHASE_PROPOSALS'), getById);
router.post('/', checkPermission('CREATE_PURCHASE_PROPOSAL'), generalUpload.single('file'), create);
router.put('/:id', generalUpload.single('file'), update); // Update bao gồm cả sửa (Requester) và Duyệt (Leader/Director), logic phân quyền chi tiết nằm trong Model
router.delete('/:id', checkPermission('CREATE_PURCHASE_PROPOSAL'), remove);

export default router;
