const File = require("../models/File")

//upload file
const uploadFile = async (req, res) => {
  try {
    const newFile = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      userId: req.user.id
    })
    await newFile.save()

    res.status(201).json({
      message: "file uploaded successfully and saved to DB",
      file: newFile
    })
  }
  catch (err) {
    res.status(500).json({
      message: "upload failed"
    })
  }
}


//Get Files

const getFiles = async(req,res)=>{
  try{
    const files = await File.find({userId:req.user.id})

    res.status(200).json({
     message: "file fetched successfuly",
     files
    })

  }
  catch(err){
    console.error(err),
    res.status(401).json({
      message:"failed to fetch files"
    })
  }
}

module.exports = { uploadFile,getFiles };
