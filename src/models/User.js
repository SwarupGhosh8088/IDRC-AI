import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'operator', 'coordinator', 'resource_manager', 'analyst', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'disabled', 'pending'],
    default: 'active'
  },
  lastLoginAt: { type: Date }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
    }
  }
});

export const User = mongoose.model('User', userSchema);
