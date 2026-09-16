import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getPublicKey, subscribe, unsubscribe, sendTestPush } from '../controllers/push.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/public-key', getPublicKey);
router.post('/subscribe', subscribe);
router.delete('/subscribe', unsubscribe);
router.post('/test', sendTestPush);

export default router;