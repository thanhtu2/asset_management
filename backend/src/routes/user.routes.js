import express from 'express';
import { 
  getAll, 
  getAllSimple, 
  getById, 
  create, 
  update, 
  remove, 
  exportUsers,
  importUsers,
  downloadImportTemplate
} from '../controllers/user.controller.js';
import { authMiddleware, checkPermission } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkPermission('MANAGE_USERS'), getAll);
router.post('/import', checkPermission('MANAGE_USERS'), uploadMiddleware.single('file'), importUsers);
router.get('/import/template', checkPermission('MANAGE_USERS'), downloadImportTemplate);
router.get('/export', checkPermission('MANAGE_USERS'), exportUsers);
router.get('/simple', getAllSimple);
router.get('/:id', getById);
router.post('/', checkPermission('MANAGE_USERS'), create);
router.put('/:id', checkPermission('MANAGE_USERS'), update);
router.delete('/:id', checkPermission('MANAGE_USERS'), remove);
export default router;
