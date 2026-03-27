const User= require("../models/user")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");

//register user
const register = async(req,res)=>{
  try{
    const{username,password}= req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
      // check existing user
    const existingUser= await User.findOne({
      username
    })

    if(existingUser){
     return res.status(400).json({message:"User Already exists"})
    }
       // hash password
    const hashedpassword= await bcrypt.hash(password,10)
          
    //create new user
    const user= new User({
      username,
      password:hashedpassword

    })
    await user.save()
    return res.status(401).json({
      message:"user registered successfully"
    })
  }
  catch(err){
    return res.status(500).json({
      message :"server error"
    })
  }

}

//login user

const login = async(req,res)=>{
  try{
    const {username,password}=req.body;

    //check user

    const user = await User.findOne({
      username
    })
    if(!user){
      return res.status(401).json({message:"invalid credentials"})

    }

    //compare password
  
    const isMatch= await bcrypt.compare(password,user.password)

    if(!isMatch){
      return res.status(401).json({
        message:"invalid credentials"
      })
    }
    // generate token

    const token = jwt.sign({id:user._id, role:user.role},
      process.env.JWT_SECRET,
      {expiresIn:"1h"}
    )

    res.json({
      message:"login successful",
      token
    })
  }
  catch(err){
    console.log("err")
    return res.status(201).json({
      message:"server error"
      
    })
  }
}


module.exports={register,login}