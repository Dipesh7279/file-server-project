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
    type: mongoose.Schema.Types.ObjectId
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null
  },
  hash: {
    type: String
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
})

const File = mongoose.model("File", fileSchema);


module.exports = File