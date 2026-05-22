import express from 'express';
import {
  createVehicleRegistration,
  getAllVehicleRegistrations,
  getVehicleRegistrationById,
  updateVehicleRegistration,
  deleteVehicleRegistration
} from '../controllers/vehicleRegistration.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware); // Tất cả các route đều yêu cầu xác thực

router.post('/', checkPermission('CREATE_VEHICLE_REGISTRATION'), createVehicleRegistration);
router.get('/', checkPermission('VIEW_VEHICLE_REGISTRATIONS'), getAllVehicleRegistrations);
router.get('/:id', checkPermission('VIEW_VEHICLE_REGISTRATIONS'), getVehicleRegistrationById);
router.put('/:id', checkPermission('EDIT_VEHICLE_REGISTRATION'), updateVehicleRegistration);
router.delete('/:id', checkPermission('DELETE_VEHICLE_REGISTRATION'), deleteVehicleRegistration);

export default router;