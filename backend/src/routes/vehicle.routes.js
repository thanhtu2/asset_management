import express from 'express';
import { getAllVehicles } from '../controllers/vehicle.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', getAllVehicles);

export default router;