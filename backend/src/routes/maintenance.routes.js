import express from 'express';
import { getAll, getById, create, update, remove, getUpcoming, getCosts, completeRepair } from '../controllers/maintenance.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/upcoming', getUpcoming);
router.get('/costs', getCosts);
router.get('/:id', getById);
router.post('/', create);
router.post('/complete-repair', completeRepair);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
