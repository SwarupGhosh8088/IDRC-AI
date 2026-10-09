import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  changes: { type: mongoose.Schema.Types.Mixed },
  requestId: { type: String },
  ip: { type: String }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

auditLogSchema.index({ entityId: 1, createdAt: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
