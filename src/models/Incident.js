import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Flood', 'Fire', 'Earthquake', 'Storm', 'Landslide', 'Medical Emergency', 'Infrastructure Failure', 'Other']
  },
  severity: { 
    type: String, 
    required: true,
    enum: ['critical', 'high', 'medium', 'low']
  },
  status: { 
    type: String, 
    required: true,
    enum: ['reported', 'verified', 'assigned', 'in_progress', 'resolved', 'closed'],
    default: 'reported'
  },
  locationName: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  peopleAffected: { type: Number, min: 0, default: 0 },
  requiredResources: [{
    category: { type: String, required: true },
    quantity: { type: Number, min: 1, required: true }
  }],
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedCoordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: {
    summary: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date
  },
  reportedAt: { type: Date, default: Date.now },
  externalRef: { type: String, sparse: true, unique: true },
  deletedAt: { type: Date },
  
  // Normalized derived fields
  normalizedTitle: { type: String },
  normalizedLocation: { type: String },
  
  // AI Insights
  aiAnalysis: { type: mongoose.Schema.Types.Mixed }
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

// Indexes for common queries
incidentSchema.index({ status: 1, severity: 1, reportedAt: -1 });
incidentSchema.index({ category: 1, reportedAt: -1 });
incidentSchema.index({ normalizedLocation: 1 });
incidentSchema.index({ reportedAt: -1 });
incidentSchema.index({ deletedAt: 1 });

// Text index for search
incidentSchema.index({ title: 'text', description: 'text', locationName: 'text' });

// Pre-save hook to generate normalized fields
incidentSchema.pre('save', function() {
  if (this.isModified('title')) {
    this.normalizedTitle = this.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  }
  if (this.isModified('locationName')) {
    this.normalizedLocation = this.locationName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  }
});

export const Incident = mongoose.model('Incident', incidentSchema);
