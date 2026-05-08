import express from 'express';
import {
  getAll, getAllSimple, getById, getByCode, getByBarcode,
  create, update, remove, getStats, generateQR, reportDamage,
  importAssets, downloadTemplate, exportAssets, updateStatus, getUserHistory
} from '../controllers/asset.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = express.Router();

// Để ngăn chặn xung đột định tuyến, các route tĩnh cụ thể được định nghĩa trước các route động.

// --- Các Route Tĩnh Cụ Thể ---
// Public
router.get('/all', getAllSimple);
// Protected - áp dụng authMiddleware riêng lẻ để đảm bảo chúng được ưu tiên
router.get('/export', authMiddleware, exportAssets);
router.get('/stats', authMiddleware, getStats);
router.get('/template', authMiddleware, downloadTemplate);

// --- Các Route Động ---
// Public
router.get('/code/:code', getByCode);
router.get('/barcode/:barcode', getByBarcode);
router.get('/:id(\\d+)/qrcode', generateQR);
router.post('/public/:id(\\d+)/report-damage', reportDamage);
router.get('/:id(\\d+)/user-history', authMiddleware, getUserHistory);
router.get('/:id(\\d+)', getById); // Public GET cho phép quét QR

// --- Các Route Được Bảo Vệ ---
// Áp dụng auth middleware cho tất cả các route sau đây
router.use(authMiddleware);

router.get('/', checkPermission('VIEW_ASSETS'), getAll);
router.patch('/:id(\\d+)/status', updateStatus);
router.post('/', checkPermission('CREATE_ASSET'), create);
router.post('/import', checkPermission('CREATE_ASSET'), uploadMiddleware.single('file'), importAssets);
router.put('/:id(\\d+)', checkPermission('EDIT_ASSET'), update);
router.delete('/:id(\\d+)', checkPermission('DELETE_ASSET'), remove);

export default router;
