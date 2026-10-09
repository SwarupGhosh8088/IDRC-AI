import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema({
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  quantity: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['recommended', 'approved', 'deployed', 'returned', 'cancelled'],
    default: 'recommended'
  },
  priorityScore: { type: Number, required: true },
  rationale: { type: String }, // explanation of why it was recommended
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deployedAt: { type: Date },
  returnedAt: { type: Date }
}, { timestamps: true });

allocationSchema.index({ incidentId: 1 });
allocationSchema.index({ resourceId: 1, status: 1 });
allocationSchema.index({ status: 1 });

export const Allocation = mongoose.model('Allocation', allocationSchema);
