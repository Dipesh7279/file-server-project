const express= require("express");

const cors= require("cors")

const app = express();

//Middleware
app.use(cors())

app.use(express.json())

//test route

app.get("/",(req,res)=>{
  res.send("file server is running ")
})

app.listen(5000,()=>{
  console.log("server is running on port 5000")
})