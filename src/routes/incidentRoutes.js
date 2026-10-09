import express from 'express';
import { createIncident, getIncidents, getIncidentById, updateIncident, updateIncidentStatus, deleteIncident, generateActionPlan } from '../controllers/incidentController.js';
import { validate } from '../middleware/validate.js';
import { createIncidentSchema, updateIncidentSchema, updateIncidentStatusSchema } from '../validators/incidentValidators.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin', 'coordinator', 'operator', 'user'), validate(createIncidentSchema), createIncident);
router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.patch('/:id', validate(updateIncidentSchema), updateIncident);
router.patch('/:id/status', validate(updateIncidentStatusSchema), updateIncidentStatus);
router.post('/:id/action-plan', authorize('admin', 'coordinator', 'operator'), generateActionPlan);
router.delete('/:id', authorize('admin', 'coordinator', 'operator', 'user'), deleteIncident);

export default router;
