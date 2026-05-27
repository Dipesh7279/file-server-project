const path = require("path")
const File = require("../models/File")
const { Folder } = require("../models/Folder")

const fs = require("fs");

//upload file
const uploadFile = async (req, res) => {
  try {

    if(!req.file || !req.file.path ){
return res.status(400).json({
  message:"file path required"
})
    }
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

const getFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id })

    res.status(200).json({
      message: "file fetched successfuly",
      files
    })

  }
  catch (err) {
    console.error(err),
      res.status(500).json({
        message: "failed to fetch files"
      })
  }
}




//Download file


const downloadfile = async (req, res) => {
  try {
    const fileID = req.params.id;


    const file = await File.findById(fileID);

    if (!file) {
      return res.status(404).json({
        message: "File not found"
      })
    }

    if (file.userId.toString() != req.user.id) {
      return res.status(403).json({
        message: "Unauthorized access "
      })
    }

    const filepath = path.join(__dirname, "..", file.path)

    res.download(filepath, file.originalname);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Download Failed"

    })
  }
}

// delete Function

const deleteFile = async (req, res) => {
  try {

    const fileID = req.params.id;

    const file = await File.findById(fileID);

    if (!file) {
      return res.status(404).json({
        message: "File not found"
      })
    }

    //check ownership
    if (file.userId.toString() != req.user.id) {
      return res.status(403).json({
        message: "unauthorized access"
      })
    }


    const filepath = path.join(__dirname, "..", file.path)


    // delete from storage

    await fs.promises.unlink(filepath);

    //delete from db
    await File.findByIdAndDelete(fileID)

    res.status(200).json({
      message: "File deleted successfully"
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "error in file deletion"
    })
  }
}

//Rename file 

const renamefile = async (req, res) => {

  try {
    const fileID = req.params.id;
    const newName = req.body.newName;

    // Validate newName
    if (!newName || newName.trim() === "") {
      return res.status(400).json({
        message: "New filename is required"
      })
    }

    const file = await File.findById(fileID)

    if (!file) {
      return res.status(500).json({
        message: "File not found"
      })
    }

    if (file.userId.toString() != req.user.id) {
      return res.status(401).json({
        message: "Unauthorized"
      })
    }

    const oldpath = path.join(__dirname, "..", file.path)

    // new file with the same extension 

    const ext = path.extname(file.originalname);

    const newfilename = newName.trim() + ext;

    const newpath = path.join("uploads", newfilename)

    //rename file in storage
    fs.renameSync(oldpath, path.join(__dirname, "..", newpath))

    //update db
    file.filename = newfilename;
    file.path = newpath;
    file.originalname = newfilename;

    await file.save();

    return res.status(200).json({
      message: "File updated successfully",
      file: file
    })
  } catch (error) {
    console.error("Rename error:", error)
    return res.status(500).json({
      message: "file update failed",
      error: error.message
    })
  }
}

const movefile =async(req,res)=>{
  try{
  const fileID =req.params.id;
  const {folderId} = req.body
  
  // Validate folderId is provided
  if(!folderId){
    return res.status(400).json({
      message:"Folder ID is required in request body"
    });
  }
  
  //find file
  const file= await File.findById(fileID)
  if(!file){
    return res.status(404).json({
      message:"file not found"
    });
  }

  //ownership check

  if(file.userId.toString() !==req.user.id){
    return res.status(403).json({
  message:"unauthorized"
})}

//Find target folder
console.log("Looking for folder with ID:", folderId);
const folder = await Folder.findById(folderId);

if(!folder){
  console.log("Folder not found in database for ID:", folderId);
  return res.status(404).json({
    message:"Folder not found - Make sure the folder ID is correct and created by this user"
  });
}

// check folder ownership
if(folder.userID.toString() !==req.user.id){
  return res.status(403).json({
    message:"unauthorized folder access"
  });
}

//move file
file.folderId = folderId

await file.save();

res.status(200).json({
  message:"File moved successfully"
});
} catch(error){
  console.error(error);
  res.status(500).json({
    message:"move failed",
    error: error.message
  })
  }
}

const searchFiles = async(req,res) =>{
  try{
    const { name , page =1 , limit =5} = req.query

    //search condition
    const searchQuery ={
      userId:req.user.id,
      originalname:{
        $regex: name || "",
        $options : "i"
      }
    };

    //pagination calculation
    const skip = (page-1)*limit;

    //fetch files
    const files = await File.find(searchQuery)
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1});

    //total count
    const total = await File.countDocuments(searchQuery);
    res.status(200).json({
      message:"Files fetched suceesfully",
      total,
      currentPage:Number(page),
      totalPages: Math.ceil(total/limit),
      files
    });
  } catch(error){
    console.error(error);
    res.status(500).json({
      message:"search failed"
    });
  }
};



module.exports = { uploadFile, getFiles, downloadfile, deleteFile, renamefile,movefile,searchFiles };