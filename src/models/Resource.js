import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Medical supplies', 'Food and water', 'Rescue equipment', 'Shelter supplies', 'Transportation', 'Personnel']
  },
  description: { type: String },
  totalQuantity: { type: Number, required: true, min: 0 },
  availableQuantity: { type: Number, required: true, min: 0 },
  reservedQuantity: { type: Number, default: 0, min: 0 },
  deployedQuantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, required: true },
  storageLocation: { type: String, required: true },
  lowStockThreshold: { type: Number, default: 10, min: 0 },
  status: {
    type: String,
    enum: ['available', 'low_stock', 'depleted', 'unavailable', 'retired'],
    default: 'available'
  },
  allocationEligible: { type: Boolean, default: true },
  consumable: { type: Boolean, default: false }, // Medical, Food, Shelter usually true
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

resourceSchema.index({ category: 1, status: 1 });
resourceSchema.index({ name: 1 });
resourceSchema.index({ updatedAt: -1 });

// Ensure available + reserved + deployed = total
resourceSchema.pre('validate', function() {
  if (['unavailable', 'retired'].includes(this.status)) return;
  
  const sum = this.availableQuantity + this.reservedQuantity + this.deployedQuantity;
  if (this.totalQuantity !== sum) {
    this.invalidate('totalQuantity', `Sum of available (${this.availableQuantity}) + reserved (${this.reservedQuantity}) + deployed (${this.deployedQuantity}) must equal total (${this.totalQuantity})`);
  }
});

// Derive status based on quantities
resourceSchema.pre('save', function() {
  if (!['unavailable', 'retired'].includes(this.status)) {
    if (this.availableQuantity === 0) {
      this.status = 'depleted';
    } else if (this.availableQuantity <= this.lowStockThreshold) {
      this.status = 'low_stock';
    } else {
      this.status = 'available';
    }
  }
});

export const Resource = mongoose.model('Resource', resourceSchema);
