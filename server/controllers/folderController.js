const { Folder } = require("../models/Folder")


const createFolder = async (req, res) => {
  try {

    const { name, parentID } = req.body;

    console.log("Creating folder with:", { name, parentID, userID: req.user?.id });

    const folder = await Folder.create({
      name,
      parentID: parentID || null,
      userID: req.user.id
    });

    console.log("Folder created:", folder);

    return res.status(201).json({
      message: "Folder created successfully",
      folder: folder
    })
  } catch (err) {
    console.error("Folder creation error:", err.message);
    return res.status(500).json({
      message: "failed to create folder",
      error: err.message
    })
  }
}

module.exports = { createFolder }


