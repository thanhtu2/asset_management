import express from 'express';
import {
  getAll, getAllSimple, getById, getByCode, getByBarcode,
  create, update, remove, getStats, generateQR, reportDamage,
  importAssets, downloadTemplate, exportAssets, updateStatus
} from '../controllers/asset.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
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
router.get('/:id(\\d+)', getById); // Public GET cho phép quét QR

// --- Các Route Được Bảo Vệ ---
// Áp dụng auth middleware cho tất cả các route sau đây
router.use(authMiddleware);

router.get('/', getAll);
router.patch('/:id(\\d+)/status', updateStatus);
router.post('/', create);
router.post('/import', uploadMiddleware.single('file'), importAssets);
router.put('/:id(\\d+)', update);
router.delete('/:id(\\d+)', remove);

export default router;
