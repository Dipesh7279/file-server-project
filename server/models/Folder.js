const mongoose = require("mongoose")

const folderSchema = new mongoose.Schema({
  name:{
type:String,
required:true
  },
  parentID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"folder",
    default:null

  },
  userID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"

  },createdAt:{
    default:Date.now(),
    type:Date
  }
})

const Folder = mongoose.model("Folder",folderSchema)

module.exports = {Folder}