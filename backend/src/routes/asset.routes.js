import express from 'express';
import {
  getAll, getAllSimple, getById, getByCode, getByBarcode,
  create, update, remove, getStats, generateQR, reportDamage,
  importAssets, downloadTemplate, exportAssets, updateStatus, getUserHistory, getPublicHistory
} from '../controllers/asset.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = express.Router();

// =========================================================================
// 1. CÁC ROUTE CÔNG KHAI (PUBLIC) - KHÔNG YÊU CẦU ĐĂNG NHẬP
// =========================================================================
router.get('/all', getAllSimple); // Lấy danh sách rút gọn cho dropdown
router.get('/code/:code', getByCode); // Tra cứu công khai theo mã tài sản
router.get('/barcode/:barcode', getByBarcode); // Tra cứu công khai theo mã vạch
router.get('/:id(\\d+)', getById); // API chính để xem chi tiết công khai khi quét QR
router.get('/:id(\\d+)/qrcode', generateQR); // API công khai để sinh ảnh QR
router.post('/public/:id(\\d+)/report-damage', reportDamage); // API công khai để báo hỏng
router.get('/public/:id(\\d+)/history', getPublicHistory); // API CÔNG KHAI MỚI để lấy lịch sử dùng và bảo trì

// =========================================================================
// 2. CÁC ROUTE YÊU CẦU ĐĂNG NHẬP (PRIVATE)
// Middleware này sẽ áp dụng cho TẤT CẢ các route được định nghĩa bên dưới nó.
// =========================================================================
router.use(authMiddleware); 

router.get('/', checkPermission('VIEW_ASSETS'), getAll); // Xem danh sách chính
router.get('/export', checkPermission('VIEW_ASSETS'), exportAssets);
router.get('/stats', checkPermission('VIEW_ASSETS'), getStats);
router.get('/template', checkPermission('VIEW_ASSETS'), downloadTemplate);
router.get('/:id(\\d+)/user-history', checkPermission('VIEW_ASSETS'), getUserHistory); // Lấy lịch sử người dùng (đã chuyển xuống đây)
router.patch('/:id(\\d+)/status', checkPermission('EDIT_ASSET'), updateStatus);
router.post('/', checkPermission('CREATE_ASSET'), create);
router.post('/import', checkPermission('CREATE_ASSET'), uploadMiddleware.single('file'), importAssets);
router.put('/:id(\\d+)', checkPermission('EDIT_ASSET'), update);
router.delete('/:id(\\d+)', checkPermission('DELETE_ASSET'), remove);

export default router;
