import express from 'express';
import {
  createTrip,
  getAllTrips,
  getTripById,
  deleteTrip,
  updateTrip
} from '../controllers/vehicleTrip.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware); // Tất cả các route đều yêu cầu xác thực

router.post('/', checkPermission('CREATE_VEHICLE_TRIP'), createTrip);
router.get('/', checkPermission('VIEW_VEHICLE_TRIPS'), getAllTrips);
router.get('/:id', checkPermission('VIEW_VEHICLE_TRIPS'), getTripById);
router.put('/:id', updateTrip); // Cho phép sửa/duyệt, logic chi tiết xử lý trong controller
router.delete('/:id', checkPermission('DELETE_VEHICLE_TRIP'), deleteTrip);

export default router;