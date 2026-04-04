const path = require("path")
const File = require("../models/File")

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
      res.status(401).json({
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
      return res.status(201).json({
        message: "File not found"
      })
    }

    if (file.userId.toString() != req.user.id) {
      return res.status(201).json({
        message: "Unauthorized access "
      })
    }

    const filepath = path.join(__dirname, "..", file.path)

    res.download(filepath, file.originalname);

  } catch (err) {
    console.error(err);
    return res.status(201).json({
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
      return res.status(201).json({
        message: "File not found"
      })
    }

    //check ownership
    if (file.userId.toString() != req.user.id) {
      return res.status(201).json({
        message: "unauthorized access"
      })
    }


    const filepath = path.join(__dirname, "..", file.path)


    // delete from storage

    fs.unlinkSync(filepath);

    //delete from db
    await File.findByIdAndDelete(fileID)

    res.status(201).json({
      message: "File deleted successfully"
    })

  } catch (err) {
    console.error(err)
    res.status(201).json({
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


module.exports = { uploadFile, getFiles, downloadfile, deleteFile, renamefile };