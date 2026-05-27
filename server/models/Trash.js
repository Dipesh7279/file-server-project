const mongoose = require("mongoose")

const trashSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  originalPath: {
    type: String,
    required: true
  },
  originalFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null
  },
  filename: {
    type: String,
    required: true
  },
  size: {
    type: Number
  },
  deletedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: true,
    expires: 2592000 // MongoDB auto-delete after 30 days
  },
  reason: {
    type: String,
    default: null
  }
})

// Index for common queries
trashSchema.index({ userId: 1, deletedAt: -1 })
trashSchema.index({ fileId: 1 })

module.exports = mongoose.model("Trash", trashSchema)
