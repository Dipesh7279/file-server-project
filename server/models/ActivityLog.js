const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  action: {
    type: String,
    enum: [
      "register",
      "login",
      "logout",
      "verify_email",
      "change_password",
      "reset_password",
      "update_profile",
      "file_upload",
      "file_download",
      "file_delete",
      "file_rename",
      "file_move",
      "file_copy",
      "file_share",
      "folder_create",
      "folder_delete",
      "folder_rename",
      "folder_move",
      "folder_share",
      "admin_action"
    ],
    required: true
  },

  resourceType: {
    type: String,
    enum: ["user", "file", "folder", "share", "system"],
    default: "system"
  },

  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  resourceName: {
    type: String,
    default: null
  },

  description: {
    type: String,
    default: null
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  ipAddress: {
    type: String,
    default: null
  },

  userAgent: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ["success", "failure"],
    default: "success"
  },

  errorMessage: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 2592000 // Auto-delete after 30 days
  }
});

// Indexes for common queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resourceType: 1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
