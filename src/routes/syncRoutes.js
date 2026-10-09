import express from 'express';
import { processSyncBatch, getSyncStatus } from '../controllers/syncController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/batch', processSyncBatch);
router.get('/status', getSyncStatus);

export default router;
