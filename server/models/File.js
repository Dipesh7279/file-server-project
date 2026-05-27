const mongoose = require("mongoose")

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null
  },
  hash: {
    type: String,
    index: true
  },
  mimetype: {
    type: String
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  versions: [{
    hash: String,
    path: String,
    size: Number,
    createdAt: Date,
    version: Number
  }],
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
})

// Index for common queries
fileSchema.index({ userId: 1, isDeleted: 1 })
fileSchema.index({ createdAt: -1 })

const File = mongoose.model("File", fileSchema);

module.exports = File