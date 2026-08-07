import express from 'express';
import {
  createVehicleRegistration,
  getAllVehicleRegistrations,
  getVehicleRegistrationById,
  updateVehicleRegistration,
  approveRegistration,
  rejectRegistration,
  assignVehicle,
  requestChange,
  approveChangeRequest,
  rejectChangeRequest,
  deleteVehicleRegistration,
  exportVehicleRegistrations,
  getChangeDetails,
  mergeRegistration,
  findSimilarTrips,
  addDepartmentToTrip
} from '../controllers/vehicleRegistration.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';
import { generalUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', checkPermission('CREATE_VEHICLE_REGISTRATION'), generalUpload.single('file'), createVehicleRegistration);
router.get('/', checkPermission('VIEW_VEHICLE_REGISTRATIONS'), getAllVehicleRegistrations);
router.get('/export', checkPermission('VIEW_VEHICLE_REGISTRATIONS'), exportVehicleRegistrations);
// QUAN TRỌNG: route tĩnh '/find-similar' phải khai báo TRƯỚC route động '/:id',
// nếu không Express sẽ hiểu "find-similar" là giá trị của :id.
router.get('/find-similar', checkPermission('CREATE_VEHICLE_REGISTRATION'), findSimilarTrips);
router.get('/:id', checkPermission('VIEW_VEHICLE_REGISTRATIONS'), getVehicleRegistrationById);

// Ghép phòng ban vào chuyến đã có sẵn (gợi ý ghép chuyến khi trùng ngày + điểm đến)
router.post('/add-department/:id', checkPermission('CREATE_VEHICLE_REGISTRATION'), addDepartmentToTrip);
//hợp nhất phiếu đăng ký xe 
router.post('/merge', checkPermission('COORDINATE_VEHICLE'), mergeRegistration);
// Sửa phiếu (trước đây frontend gọi route này nhưng backend chưa từng định nghĩa -> luôn 404)
router.put('/:id', checkPermission('EDIT_VEHICLE_REGISTRATION'), generalUpload.single('file'), updateVehicleRegistration);

// Action routes — Duyệt / Từ chối
router.put('/:id/approve', checkPermission('APPROVE_VEHICLE_REGISTRATION'), approveRegistration);
router.put('/:id/reject', checkPermission('APPROVE_VEHICLE_REGISTRATION'), rejectRegistration);

// Gán xe (chỉ điều phối viên)
router.put('/:id/assign', checkPermission('COORDINATE_VEHICLE'), assignVehicle);
// Lấy chi tiết yêu cầu thay đổi (chỉ điều phối viên)
router.get('/:id/change/:changeId', checkPermission('COORDINATE_VEHICLE'), getChangeDetails);

// Yêu cầu thay đổi khi đã lên lịch — Duyệt / Từ chối yêu cầu thay đổi
router.post('/:id/request-change', checkPermission('CREATE_VEHICLE_REGISTRATION'), generalUpload.single('file'), requestChange);
router.put('/:id/approve-change/:changeId', checkPermission('COORDINATE_VEHICLE'), approveChangeRequest);
router.put('/:id/reject-change/:changeId', checkPermission('COORDINATE_VEHICLE'), rejectChangeRequest);

router.delete('/:id', checkPermission('DELETE_VEHICLE_REGISTRATION'), deleteVehicleRegistration);

export default router;