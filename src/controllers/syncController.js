import { SyncOperation } from '../models/SyncOperation.js';
import { Incident } from '../models/Incident.js';
import { Resource } from '../models/Resource.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Handles batch synchronization from offline clients.
 * Expects an array of operations:
 * { operationId: uuid, type: string, payload: object, timestamp: iso_string }
 */
export const processSyncBatch = asyncHandler(async (req, res) => {
  const { operations = [] } = req.body;
  const results = {
    applied: [],
    duplicates: [],
    conflicts: [],
    failed: []
  };

  for (const op of operations) {
    // 1. Idempotency Check
    const existingOp = await SyncOperation.findOne({ operationId: op.operationId });
    if (existingOp) {
      results.duplicates.push(op.operationId);
      continue; // Skip already processed operation
    }

    try {
      let status = 'failed';
      let details = {};

      // 2. Route Operation
      if (op.type === 'CREATE_INCIDENT') {
        const incident = new Incident({
          ...op.payload,
          reportedBy: req.user._id,
          status: 'reported'
        });
        await incident.save();
        status = 'success';
        details = { entityId: incident._id };
        results.applied.push({ operationId: op.operationId, entityId: incident._id });
      } 
      else if (op.type === 'UPDATE_INCIDENT_STATUS') {
        const incident = await Incident.findById(op.payload.id);
        if (!incident) {
          status = 'rejected';
          details = { reason: 'Incident not found' };
          results.failed.push({ operationId: op.operationId, reason: 'Not found' });
        } else {
          // Simple conflict check: if the server timestamp is significantly newer than the operation's known base timestamp
          // (Assuming op.payload.baseUpdatedAt was provided by client)
          if (op.payload.baseUpdatedAt && new Date(incident.updatedAt) > new Date(op.payload.baseUpdatedAt)) {
             status = 'conflict';
             details = { serverState: incident.status };
             results.conflicts.push({ operationId: op.operationId, serverState: incident });
          } else {
            incident.status = op.payload.status;
            await incident.save();
            status = 'success';
            results.applied.push({ operationId: op.operationId });
          }
        }
      } 
      else {
        // Unknown operation type
        status = 'rejected';
        details = { reason: 'Unknown operation type' };
        results.failed.push({ operationId: op.operationId, reason: 'Unknown type' });
      }

      // 3. Record Operation
      await SyncOperation.create({
        operationId: op.operationId,
        actorId: req.user._id,
        type: op.type,
        status,
        details
      });

    } catch (err) {
      console.error(`Sync Op Error [${op.operationId}]:`, err.message);
      results.failed.push({ operationId: op.operationId, reason: err.message });
      
      // Attempt to log failure
      await SyncOperation.create({
        operationId: op.operationId,
        actorId: req.user._id,
        type: op.type,
        status: 'failed',
        details: { error: err.message }
      }).catch(e => console.error('Failed to log sync error', e));
    }
  }

  res.status(200).json({
    success: true,
    data: results
  });
});

export const getSyncStatus = asyncHandler(async (req, res) => {
  // Return the latest operations for this user so the client can clear its queue
  const recent = await SyncOperation.find({ actorId: req.user._id })
    .sort('-processedAt')
    .limit(50);
  
  res.status(200).json({ success: true, data: recent });
});
