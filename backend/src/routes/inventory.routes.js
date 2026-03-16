import express from 'express';
import { 
  getAll, getById, create, update, remove, 
  addAssets, getRecords, updateRecord, getSummary, complete,
  addAssetsByDepartment, addAllAssets, getRecordsWithDepartment, getSummaryByDepartment, scanAsset
} from '../controllers/inventory.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/records', getRecords);
router.get('/:id/records-by-department', getRecordsWithDepartment);
router.get('/:id/summary', getSummary);
router.get('/:id/summary-by-department', getSummaryByDepartment);
router.post('/', create);
router.post('/:id/assets', addAssets);
router.post('/:id/assets-by-department', addAssetsByDepartment);
router.post('/:id/assets-all', addAllAssets);
router.post('/:id/complete', complete);
router.post('/:id/scan', scanAsset); // New route for scanning
router.put('/:id', update);
router.put('/:id/records/:recordId', updateRecord);
router.delete('/:id', remove);

export default router;
