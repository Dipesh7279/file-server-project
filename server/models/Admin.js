const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users',
      'delete_users',
      'suspend_users',
      'view_activity',
      'manage_storage',
      'manage_files',
      'manage_shares',
      'system_settings',
      'view_analytics',
      'view_reports'
    ]
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastAccess: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  notes: {
    type: String,
    default: null
  }
});

// Index for common queries
adminSchema.index({ role: 1, isActive: 1 });
adminSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Admin", adminSchema);
