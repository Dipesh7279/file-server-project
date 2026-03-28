const express= require("express");

const cors= require("cors")

const dotenv = require("dotenv");
const connectDB = require("./config/db");

const authroutes= require("./routes/authroutes")
const authmiddleware= require("./middleware/authMiddleware")

const fileroutes = require("./routes/fileRoutes")

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
});


//Auth middleware request
app.get("/api/protected",authmiddleware,(req,res) =>{
  res.json({
    message:"protected route accessed",
    req: req.user

  })
})

app.use("/api/auth",authroutes)

app.use("/api/files",fileroutes)

app.listen(5000,()=>{
  console.log("server is running on port 5000")
})