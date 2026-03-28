

const uploadFile=  (req,res)=>{
  try{
    res.status(201).json({
      message:"file uploaded successfully",
      file: req.file })
    }
    catch(err){
      res.status(500).json({
        message:"upload failed"
      })
    }
  }

module.exports = { uploadFile };
