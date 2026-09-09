import express from 'express';
import { getAllVehicles,createExternalVehicle } from '../controllers/vehicle.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', getAllVehicles);
router.post('/external', checkPermission('COORDINATE_VEHICLE'), createExternalVehicle);
export default router;