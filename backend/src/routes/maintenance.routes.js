import express from 'express';
import { getAll, getById, create, update, remove, getUpcoming, getCosts, completeRepair } from '../controllers/maintenance.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkPermission('VIEW_MAINTENANCE'), getAll);
router.get('/upcoming', checkPermission('VIEW_MAINTENANCE'), getUpcoming);
router.get('/costs', checkPermission('VIEW_MAINTENANCE'), getCosts);
router.get('/:id', checkPermission('VIEW_MAINTENANCE'), getById);
router.post('/', checkPermission('CREATE_MAINTENANCE'), create);
router.post('/complete-repair', checkPermission('EDIT_MAINTENANCE'), completeRepair);
router.put('/:id', checkPermission('EDIT_MAINTENANCE'), update);
router.delete('/:id', checkPermission('DELETE_MAINTENANCE'), remove);

export default router;
