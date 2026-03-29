const File = require("../models/File")

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

module.exports = { uploadFile };
