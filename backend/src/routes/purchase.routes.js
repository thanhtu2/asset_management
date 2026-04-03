import express from 'express';
import pool from '../config/database.js';
import { 
  getAll, getById, create, update, remove, getStats 
} from '../controllers/purchaseProposal.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, getById);
router.get('/stats', authMiddleware, getStats);
router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, remove);

export default router;

