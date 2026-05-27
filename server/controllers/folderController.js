const { Folder } = require("../models/Folder")

// create folder
const createFolder = async (req, res) => {
  try {

    const { name, parentID } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folder = await Folder.create({
      name,
      parentID: parentID || null,
      userID: req.user.id
    });

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

// Get folders
const getfolder = async (req, res) => {
  try {

    const folder = await Folder.find({ userID: req.user.id })
    res.status(200).json({
      message: "Fetch folder successfully",
      folder
    })
  }
  catch (err) {
    console.error(err)
    res.status(500).json({
      message: "failed to fetch folder",
      error: err.message

    })
  }
}

// Delete folder
const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user.id;

    // Find the folder and verify ownership
    const folder = await Folder.findById(id);

    if (!folder) {
      return res.status(404).json({
        message: "Folder not found"
      });
    }

    if (folder.userID.toString() !== userID.toString()) {
      return res.status(403).json({
        message: "Not authorized to delete this folder"
      });
    }

    // Delete the folder
    await Folder.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Folder deleted successfully"
    });
  } catch (err) {
    console.error("Folder deletion error:", err.message);
    return res.status(500).json({
      message: "Failed to delete folder",
      error: err.message
    });
  }
};


//build tree function

const builderfolderTree = (folders, parentID = null) => {
  const tree = [];
  folders.forEach(folder => {
    if (
      (folder.parentID === null && parentID === null) ||
      (folder.parentID && folder.parentID.toString() === parentID)
    ) {
      const children = builderfolderTree(folders, folder._id.toString());
      tree.push({
        ...folder._doc,
        children
      });
    }
  });
  return tree;
}

//get folder tree
const getFolderTree = async (req, res) => {
  try {
    const folders = await Folder.find({ userID: req.user.id });
    const tree = builderfolderTree(folders);
    res.status(200).json({
      message: "folder tree fetched",
      tree
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "failed to fetch tree" });
  }
};



module.exports = { createFolder, getfolder, deleteFolder, getFolderTree }