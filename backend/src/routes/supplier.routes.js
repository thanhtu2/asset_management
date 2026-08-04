import express from 'express';
import { getAll, getById, create, update, remove } from '../controllers/supplier.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkPermission('VIEW_SUPPLIERS'), getAll);
router.get('/:id', checkPermission('VIEW_SUPPLIERS'), getById);
router.post('/', checkPermission('CREATE_SUPPLIER'), create);
router.put('/:id', checkPermission('EDIT_SUPPLIER'), update);
router.delete('/:id', checkPermission('DELETE_SUPPLIER'), remove);

export default router;
