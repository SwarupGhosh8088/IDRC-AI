import mongoose from 'mongoose';

const syncOperationSchema = new mongoose.Schema({
  operationId: { type: String, required: true, unique: true }, // Client-generated UUID
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // e.g., 'CREATE_INCIDENT', 'UPDATE_RESOURCE'
  status: { type: String, enum: ['success', 'conflict', 'failed', 'rejected'], required: true },
  processedAt: { type: Date, default: Date.now },
  details: { type: mongoose.Schema.Types.Mixed } // Error messages, conflicts, or resulting IDs
});

export const SyncOperation = mongoose.model('SyncOperation', syncOperationSchema);
