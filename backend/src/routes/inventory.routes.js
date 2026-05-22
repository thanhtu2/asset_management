import express from 'express';
import { 
  getAll, getById, create, update, remove, 
  addAssets, getRecords, updateRecord, getSummary, complete,
  addAssetsByDepartment, addAllAssets, getRecordsWithDepartment, getSummaryByDepartment, scanAsset,
  exportInventoryReport
} from '../controllers/inventory.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkPermission('VIEW_INVENTORY'), getAll);
router.get('/:id', checkPermission('VIEW_INVENTORY'), getById);
router.get('/:id/records', checkPermission('VIEW_INVENTORY'), getRecords);
router.get('/:id/records-by-department', checkPermission('VIEW_INVENTORY'), getRecordsWithDepartment);
router.get('/:id/summary', checkPermission('VIEW_INVENTORY'), getSummary);
router.get('/:id/summary-by-department', checkPermission('VIEW_INVENTORY'), getSummaryByDepartment);
router.get('/:id/export', checkPermission('VIEW_INVENTORY'), exportInventoryReport);
router.post('/', checkPermission('CREATE_INVENTORY'), create);
router.post('/:id/assets', checkPermission('EDIT_INVENTORY'), addAssets);
router.post('/:id/assets-by-department', checkPermission('EDIT_INVENTORY'), addAssetsByDepartment);
router.post('/:id/assets-all', checkPermission('EDIT_INVENTORY'), addAllAssets);
router.post('/:id/complete', checkPermission('EDIT_INVENTORY'), complete);
router.post('/:id/scan', checkPermission('EDIT_INVENTORY'), scanAsset); 
router.put('/:id', checkPermission('EDIT_INVENTORY'), update);
router.put('/:id/records/:recordId', checkPermission('EDIT_INVENTORY'), updateRecord);
router.delete('/:id', checkPermission('DELETE_INVENTORY'), remove);

export default router;
