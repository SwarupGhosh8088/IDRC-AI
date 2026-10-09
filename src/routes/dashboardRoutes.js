import express from 'express';
import { getDashboardStats, getNetworkNodes, getDashboardAiOverview } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/network', getNetworkNodes);
router.get('/ai-overview', getDashboardAiOverview);

export default router;
