import express from 'express';
import {
  createVehicleRegistration,
  getAllVehicleRegistrations,
  getVehicleRegistrationById,
  updateVehicleRegistration,
  deleteVehicleRegistration,
  approveVehicleRegistration,
  assignVehicle,
  rejectVehicleRegistration,
  getMergeSuggestions,
  joinVehicleRegistration,
  uploadAttachment,
  deleteAttachment
} from '../controllers/vehicleRegistration.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';
import { generalUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(authMiddleware); // Tất cả các route đều yêu cầu xác thực

// Từ chối được phép ở bước 'pending' (lãnh đạo) hoặc 'approved' (điều phối)
// -> cho phép truy cập nếu có MỘT trong hai quyền, việc kiểm tra trạng thái phiếu cụ thể
// đã được xử lý ở Model (reject()).
const checkApproveOrCoordinate = (req, res, next) => {
  const perms = req.user?.permissions || [];
  if (req.user?.role === 'admin' || perms.includes('APPROVE_VEHICLE_REGISTRATION') || perms.includes('COORDINATE_VEHICLE')) {
    return next();
  }
  return res.status(403).json({ message: 'Từ chối truy cập. Bạn không có quyền xử lý phiếu này.' });
};

// Đặt route tĩnh /merge-suggestions TRƯỚC route động /:id để không bị nuốt nhầm
router.get('/merge-suggestions', getMergeSuggestions);

router.post('/', createVehicleRegistration);
router.get('/', getAllVehicleRegistrations);
router.get('/:id', checkPermission('VIEW_VEHICLE_REGISTRATIONS'), getVehicleRegistrationById);
router.put('/:id', checkPermission('EDIT_VEHICLE_REGISTRATION'), updateVehicleRegistration);
router.delete('/:id', checkPermission('DELETE_VEHICLE_REGISTRATION'), deleteVehicleRegistration);

// Luồng xử lý: pending -> approved (lãnh đạo duyệt) -> scheduled (điều phối gán xe)
router.put('/:id/approve', checkPermission('APPROVE_VEHICLE_REGISTRATION'), approveVehicleRegistration);
router.put('/:id/assign-vehicle', checkPermission('COORDINATE_VEHICLE'), assignVehicle);
router.put('/:id/reject', (req, res, next) => {
  console.log('DEBUG: Reject route hit by user:', req.user?.id, 'Role:', req.user?.role, 'Permissions:', req.user?.permissions);
  const perms = req.user?.permissions || [];
  if (req.user?.role === 'admin' || perms.includes('APPROVE_VEHICLE_REGISTRATION') || perms.includes('COORDINATE_VEHICLE')) {
    return next();
  }
  console.log('DEBUG: Access denied. Missing permissions.');
  return res.status(403).json({ message: 'Bạn không có quyền từ chối phiếu.' });
}, rejectVehicleRegistration);

// Ghép chuyến: tham gia vào phiếu đã duyệt/xếp lịch có sẵn thay vì tạo phiếu mới
router.post('/:id/join', checkPermission('CREATE_VEHICLE_REGISTRATION'), joinVehicleRegistration);

// Upload / Xóa file đính kèm — chỉ cho phép khi phiếu đang pending hoặc rejected
router.post('/:id/upload', checkPermission('EDIT_VEHICLE_REGISTRATION'), generalUpload.single('attachment'), uploadAttachment);
router.delete('/:id/attachment', checkPermission('EDIT_VEHICLE_REGISTRATION'), deleteAttachment);

export default router;
