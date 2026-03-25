const express= require("express");

const cors= require("cors")

const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

// Connect DB
connectDB();


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