const mongoose = require("mongoose");

const shareLinkSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
    index: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  shareType: {
    type: String,
    enum: ['public', 'private', 'protected'],
    default: 'private'
  },
  accessType: {
    type: String,
    enum: ['view', 'download', 'upload'],
    default: 'view'
  },
  password: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  maxDownloads: {
    type: Number,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    access: {
      type: String,
      enum: ['view', 'download', 'upload'],
      default: 'view'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
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
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
});

// Index for common queries
shareLinkSchema.index({ createdBy: 1, isActive: 1 });
shareLinkSchema.index({ fileId: 1, isActive: 1 });
shareLinkSchema.index({ token: 1, isActive: 1 });

module.exports = mongoose.model("ShareLink", shareLinkSchema);
