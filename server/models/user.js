const mongoose = require("mongoose")

const userSchema= new mongoose.Schema({
  username:{
    required:true,
    type:String,
    unique:true
  },

  password:{
    required:true,
    type:String,
    unique:true
    
  },
  role:{
    type:String,
    enum:["admin","user"],
    default:"user",
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
})

module.exports=mongoose.model("User",userSchema)