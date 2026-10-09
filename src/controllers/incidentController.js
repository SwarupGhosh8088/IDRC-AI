import { Incident } from '../models/Incident.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { checkDuplicates } from '../utils/duplicateDetection.js';
import { canTransitionIncident } from '../utils/transitions.js';
import { logAudit } from '../utils/auditLogger.js';

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

import { analyzeIncidentWithGemini, generateActionPlanWithGemini } from '../services/aiService.js';

export const generateActionPlan = asyncHandler(async (req, res) => {
  const incident = await Incident.findOne({ _id: req.params.id, deletedAt: null });
  if (!incident) throw new ApiError(404, 'Incident not found', 'NOT_FOUND');

  // Permissions: Only operators/coordinators should really generate this, 
  // but let's just make sure user is authenticated (already handled by route middleware).
  
  const actionPlan = await generateActionPlanWithGemini(incident);
  
  // Optionally save it to the DB if we want to cache it, or just return it immediately.
  res.status(200).json({ success: true, data: actionPlan });
});

export const createIncident = asyncHandler(async (req, res) => {
  const payload = req.body;

  // Duplicate Check (Existing Basic Algorithm)
  const possibleDuplicates = await checkDuplicates(payload);
  
  // AI-Powered Deep Analysis (Checks semantic duplicates & optimizes resources)
  let aiInsights = null;
  try {
    const activeIncidents = await Incident.find({ status: { $in: ['reported', 'verified', 'in_progress'] }, deletedAt: null }).limit(50);
    aiInsights = await analyzeIncidentWithGemini(payload, activeIncidents);
  } catch (error) {
    console.error("AI Analysis skipped or failed", error);
  }

  // If AI flags as duplicate, and user hasn't explicitly acknowledged duplicates
  if ((possibleDuplicates.length > 0 || (aiInsights && aiInsights.isDuplicate)) && !payload.acknowledgeDuplicates) {
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_POSSIBLE',
      message: 'Possible duplicate incidents found',
      data: { 
        matches: possibleDuplicates,
        aiDuplicateOf: aiInsights?.duplicateOfId,
        aiRationale: aiInsights?.rationale
      }
    });
  }

  // Enhance payload with AI suggestions if available
  const finalPayload = {
    ...payload,
    severity: aiInsights?.suggestedSeverity || payload.severity,
    category: aiInsights?.suggestedCategory || payload.category,
    latitude: aiInsights?.latitude || payload.latitude,
    longitude: aiInsights?.longitude || payload.longitude,
    aiAnalysis: aiInsights // Store insights for coordinator review
  };

  // Create
  const incident = new Incident({
    ...finalPayload,
    reportedBy: req.user._id,
    status: 'reported'
  });

  await incident.save();

  await logAudit({
    actorId: req.user._id,
    action: 'create',
    entityType: 'Incident',
    entityId: incident._id,
    changes: { after: incident.toObject() },
    req
  });

  res.status(201).json({ success: true, data: incident });
});

export const getIncidents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, severity, status, category, location, from, to, assignedTo, reportedBy, q, sort = '-reportedAt' } = req.query;

  const query = { deletedAt: null };

  if (severity) query.severity = { $in: severity.split(',') };
  if (status) query.status = { $in: status.split(',') };
  if (category) query.category = { $in: category.split(',') };
  if (assignedTo) query.assignedCoordinator = assignedTo;
  if (reportedBy === 'me') query.reportedBy = req.user._id;
  
  if (location) {
    query.locationName = new RegExp(escapeRegex(location), 'i');
  }

  if (from || to) {
    query.reportedAt = {};
    if (from) query.reportedAt.$gte = new Date(from);
    if (to) query.reportedAt.$lte = new Date(to);
  }

  if (q) {
    query.$or = [
      { title: new RegExp(escapeRegex(q), 'i') },
      { description: new RegExp(escapeRegex(q), 'i') },
      { locationName: new RegExp(escapeRegex(q), 'i') }
    ];
  }

  // Sort validation
  const allowedSorts = ['reportedAt', '-reportedAt', 'createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'severity', '-severity', 'peopleAffected', '-peopleAffected'];
  const sortObj = {};
  if (allowedSorts.includes(sort)) {
    sortObj[sort.replace('-', '')] = sort.startsWith('-') ? -1 : 1;
  } else {
    sortObj.reportedAt = -1;
  }
  sortObj._id = 1; // tie breaker

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));

  const [incidents, total] = await Promise.all([
    Incident.find(query)
      .sort(sortObj)
      .skip((p - 1) * l)
      .limit(l)
      .populate('reportedBy', 'name email role')
      .populate('assignedCoordinator', 'name email role'),
    Incident.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: incidents,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l)
    }
  });
});

export const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findOne({ _id: req.params.id, deletedAt: null })
    .populate('reportedBy', 'name email role')
    .populate('assignedCoordinator', 'name email role')
    .populate('resolution.resolvedBy', 'name email role');
    
  if (!incident) throw new ApiError(404, 'Incident not found', 'NOT_FOUND');
  res.status(200).json({ success: true, data: incident });
});

export const updateIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findOne({ _id: req.params.id, deletedAt: null });
  if (!incident) throw new ApiError(404, 'Incident not found', 'NOT_FOUND');

  // Permissions
  if (req.user.role === 'operator') {
    if (incident.reportedBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Can only edit own reports', 'FORBIDDEN');
    }
    if (!['reported', 'verified'].includes(incident.status)) {
      throw new ApiError(403, 'Cannot edit incident after assignment', 'FORBIDDEN');
    }
  } else if (!['admin', 'coordinator'].includes(req.user.role)) {
    throw new ApiError(403, 'Insufficient permissions', 'FORBIDDEN');
  }

  const before = incident.toObject();

  Object.assign(incident, req.body);
  await incident.save();

  await logAudit({
    actorId: req.user._id,
    action: 'update',
    entityType: 'Incident',
    entityId: incident._id,
    changes: { before, after: incident.toObject() },
    req
  });

  res.status(200).json({ success: true, data: incident });
});

export const updateIncidentStatus = asyncHandler(async (req, res) => {
  const { status, summary } = req.body;
  
  const incident = await Incident.findOne({ _id: req.params.id, deletedAt: null });
  if (!incident) throw new ApiError(404, 'Incident not found', 'NOT_FOUND');

  if (!canTransitionIncident(incident.status, status, req.user.role)) {
    throw new ApiError(422, `Invalid transition from ${incident.status} to ${status}`, 'INVALID_TRANSITION');
  }

  if (status === 'resolved') {
    if (!summary) throw new ApiError(400, 'Summary required for resolution', 'VALIDATION_ERROR');
    incident.resolution = {
      summary,
      resolvedBy: req.user._id,
      resolvedAt: new Date()
    };
  } else if (incident.status === 'resolved' && status === 'in_progress') {
    // Reopen
    incident.resolution = undefined;
  }

  const oldStatus = incident.status;
  incident.status = status;
  await incident.save();

  await logAudit({
    actorId: req.user._id,
    action: 'status_change',
    entityType: 'Incident',
    entityId: incident._id,
    changes: { before: { status: oldStatus }, after: { status } },
    req
  });

  res.status(200).json({ success: true, data: incident });
});

export const deleteIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findOne({ _id: req.params.id, deletedAt: null });
  if (!incident) throw new ApiError(404, 'Incident not found', 'NOT_FOUND');

  incident.deletedAt = new Date();
  await incident.save();

  await logAudit({
    actorId: req.user._id,
    action: 'delete',
    entityType: 'Incident',
    entityId: incident._id,
    req
  });

  res.status(204).send();
});
