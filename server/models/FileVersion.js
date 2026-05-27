const mongoose = require("mongoose")

const fileVersionSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  restoredAt: {
    type: Date,
    default: null
  },
  reason: {
    type: String,
    default: null
  }
})

// Index for common queries
fileVersionSchema.index({ fileId: 1, version: -1 })
fileVersionSchema.index({ fileId: 1, createdAt: -1 })

module.exports = mongoose.model("FileVersion", fileVersionSchema)
