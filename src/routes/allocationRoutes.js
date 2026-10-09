import express from 'express';
import { generate, getAllocations, updateAllocationStatus } from '../controllers/allocationController.js';
import { validate } from '../middleware/validate.js';
import { generateRecommendationSchema, updateAllocationStatusSchema } from '../validators/allocationValidators.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllocations);
router.post('/generate', authorize('admin', 'coordinator', 'resource_manager'), validate(generateRecommendationSchema), generate);
router.patch('/:id/status', authorize('admin', 'coordinator', 'resource_manager'), validate(updateAllocationStatusSchema), updateAllocationStatus);

export default router;
