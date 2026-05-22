import express from 'express';
import {
  getAll, getAllSimple, getById, getByCode, getByBarcode,
  create, update, remove, getStats, generateQR, reportDamage,
  importAssets, downloadTemplate, exportAssets, updateStatus, getUserHistory
} from '../controllers/asset.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = express.Router();

// 1. CÁC ROUTE CÔNG KHAI (PUBLIC) - Không cần đăng nhập
router.get('/all', getAllSimple); // Dropdown
router.get('/code/:code', getByCode); // Tra cứu theo mã
router.get('/barcode/:barcode', getByBarcode); // Tra cứu theo barcode
router.get('/:id(\\d+)', getById); // Xem chi tiết khi quét QR
router.get('/:id(\\d+)/qrcode', generateQR); // Sinh ảnh QR
router.post('/public/:id(\\d+)/report-damage', reportDamage); // Báo hỏng công khai

// 2. CÁC ROUTE YÊU CẦU ĐĂNG NHẬP (AUTH REQUIRED)
router.use(authMiddleware); 

router.get('/', checkPermission('VIEW_ASSETS'), getAll); // Xem danh sách chính
router.get('/export', checkPermission('VIEW_ASSETS'), exportAssets);
router.get('/stats', checkPermission('VIEW_ASSETS'), getStats);
router.get('/template', checkPermission('VIEW_ASSETS'), downloadTemplate);
router.get('/:id(\\d+)/user-history', checkPermission('VIEW_ASSETS'), getUserHistory);
router.patch('/:id(\\d+)/status', checkPermission('EDIT_ASSET'), updateStatus);
router.post('/', checkPermission('CREATE_ASSET'), create);
router.post('/import', checkPermission('CREATE_ASSET'), uploadMiddleware.single('file'), importAssets);
router.put('/:id(\\d+)', checkPermission('EDIT_ASSET'), update);
router.delete('/:id(\\d+)', checkPermission('DELETE_ASSET'), remove);

export default router;
