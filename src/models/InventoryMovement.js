import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema({
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  type: {
    type: String,
    required: true,
    enum: ['adjustment', 'reserve', 'release', 'deploy', 'return', 'create', 'retire']
  },
  quantity: { type: Number, required: true },
  before: {
    available: Number,
    reserved: Number,
    deployed: Number,
    total: Number
  },
  after: {
    available: Number,
    reserved: Number,
    deployed: Number,
    total: Number
  },
  allocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Allocation' },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

inventoryMovementSchema.index({ resourceId: 1, createdAt: 1 });

export const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
