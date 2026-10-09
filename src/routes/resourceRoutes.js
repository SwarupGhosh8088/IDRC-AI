import express from 'express';
import { createResource, getResources, getResourceById, updateResource, adjustInventory, deleteResource } from '../controllers/resourceController.js';
import { validate } from '../middleware/validate.js';
import { createResourceSchema, updateResourceSchema, adjustResourceSchema } from '../validators/resourceValidators.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Operators/Analysts can view resources
router.get('/', authorize('admin', 'resource_manager', 'coordinator', 'operator', 'analyst'), getResources);
router.get('/:id', authorize('admin', 'resource_manager', 'coordinator', 'operator', 'analyst'), getResourceById);

// Only admin and resource_manager can mutate
router.post('/', authorize('admin', 'resource_manager'), validate(createResourceSchema), createResource);
router.patch('/:id', authorize('admin', 'resource_manager'), validate(updateResourceSchema), updateResource);
router.patch('/:id/adjust', authorize('admin', 'resource_manager', 'operator'), validate(adjustResourceSchema), adjustInventory);
router.delete('/:id', authorize('admin'), deleteResource);

export default router;
