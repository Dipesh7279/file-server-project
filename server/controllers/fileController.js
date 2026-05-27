const path = require("path")
const crypto = require("crypto")
const File = require("../models/File")
const { Folder } = require("../models/Folder")
const Trash = require("../models/Trash")
const FileVersion = require("../models/FileVersion")
const ActivityLog = require("../models/ActivityLog")
const User = require("../models/user")
const fs = require("fs").promises

//utility function to calculate file hash
const calculateFileHash = async (filePath) => {
  const fileContent = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(fileContent).digest('hex')
}

//utility function to log activity
const logActivity = async (userId, action, resourceType, resourceId, resourceName, description, status = "success", errorMessage = null) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      resourceType,
      resourceId,
      resourceName,
      description,
      status,
      errorMessage
    })
  } catch (err) {
    console.error("Activity logging failed:", err)
  }
}

//upload file with deduplication support
const uploadFile = async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file ? { filename: req.file.filename, path: req.file.path } : null);

    if (!req.file || !req.file.path) {
      return res.status(400).json({
        message: "file path required"
      })
    }

    const filePath = req.file.path;
    const folderId = req.body.folderId && req.body.folderId !== 'null' ? req.body.folderId : null;

    console.log("FolderId extracted:", folderId);

    // Calculate file hash
    let fileHash
    try {
      fileHash = await calculateFileHash(filePath)
    } catch (hashErr) {
      console.error("Hash calculation error:", hashErr)
      await fs.unlink(filePath)
      return res.status(500).json({
        message: "Failed to process file"
      })
    }

    // Check if hash already exists (deduplication)
    const existingFile = await File.findOne({
      userId: req.user.id,
      hash: fileHash,
      isDeleted: false
    })

    if (existingFile) {
      // File with same hash already exists, delete the duplicate
      await fs.unlink(filePath)
      await logActivity(req.user.id, "file_upload", "file", existingFile._id, req.file.originalname, "Duplicate file detected, using existing copy", "success")

      return res.status(201).json({
        message: "File already exists, using existing copy",
        file: existingFile,
        isDuplicate: true
      })
    }

    // Check storage quota
    const user = await User.findById(req.user.id)
    console.log(`Storage check - User: ${req.user.id}, Used: ${user.storageUsed}, File size: ${req.file.size}, Quota: ${user.storageQuota}, Total would be: ${user.storageUsed + req.file.size}`)

    if (user.storageUsed + req.file.size > user.storageQuota) {
      await fs.unlink(filePath)
      console.log(`QUOTA EXCEEDED - Rejecting upload`)
      return res.status(413).json({
        message: "Storage quota exceeded"
      })
    }

    // Validate folder if provided
    if (folderId) {
      const folder = await Folder.findOne({
        _id: folderId,
        userID: req.user.id
      })
      if (!folder) {
        await fs.unlink(filePath)
        return res.status(404).json({
          message: "Folder not found"
        })
      }
    }

    const newFile = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: `uploads/${req.file.filename}`,
      size: req.file.size,
      userId: req.user.id,
      folderId: folderId,
      hash: fileHash,
      mimetype: req.file.mimetype,
      versions: [{
        hash: fileHash,
        path: `uploads/${req.file.filename}`,
        size: req.file.size,
        createdAt: new Date(),
        version: 1
      }]
    })

    const savedFile = await newFile.save()

    // Update user's storage usage
    user.storageUsed += req.file.size
    await user.save()

    console.log(`File uploaded successfully - Updated storage. User: ${req.user.id}, New total: ${user.storageUsed}, Quota: ${user.storageQuota}`)

    await logActivity(req.user.id, "file_upload", "file", savedFile._id, req.file.originalname, `File uploaded (${req.file.size} bytes)`, "success")

    res.status(201).json({
      message: "file uploaded successfully and saved to DB",
      file: savedFile,
      isDuplicate: false
    })
  } catch (err) {
    console.error("Upload error:", err)
    await logActivity(req.user.id, "file_upload", "file", null, req.file?.originalname, "Upload failed", "failure", err.message)
    res.status(500).json({
      message: "upload failed",
      error: err.message
    })
  }
}


//Get Files
const getFiles = async (req, res) => {
  try {
    const files = await File.find({
      userId: req.user.id,
      isDeleted: false
    }).sort({ createdAt: -1 })

    res.status(200).json({
      message: "file fetched successfuly",
      files
    })

  }
  catch (err) {
    console.error(err)
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

// delete Function - soft delete to trash
const deleteFile = async (req, res) => {
  try {
    const fileID = req.params.id

    const file = await File.findById(fileID)

    if (!file) {
      return res.status(404).json({
        message: "File not found"
      })
    }

    // check ownership
    if (file.userId.toString() != req.user.id) {
      return res.status(403).json({
        message: "unauthorized access"
      })
    }

    // Skip if already deleted
    if (file.isDeleted) {
      return res.status(400).json({
        message: "File already deleted"
      })
    }

    // Move to trash instead of permanent delete
    const trash = new Trash({
      fileId: file._id,
      userId: file.userId,
      originalPath: file.path,
      originalFolder: file.folderId,
      filename: file.originalname,
      size: file.size,
      reason: "User delete"
    })

    await trash.save()

    // Mark file as deleted
    file.isDeleted = true
    file.deletedAt = new Date()
    await file.save()

    // Decrement storage usage when file is deleted
    const user = await User.findById(req.user.id)
    user.storageUsed = Math.max(0, user.storageUsed - file.size)
    await user.save()

    await logActivity(req.user.id, "file_delete", "file", file._id, file.originalname, "File moved to trash", "success")

    res.status(200).json({
      message: "File deleted successfully and moved to trash"
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "error in file deletion",
      error: err.message
    })
  }
}

//Rename file 
const renamefile = async (req, res) => {
  try {
    const fileID = req.params.id
    const newName = req.body.newName

    // Validate newName
    if (!newName || newName.trim() === "") {
      return res.status(400).json({
        message: "New filename is required"
      })
    }

    const file = await File.findById(fileID)

    if (!file) {
      return res.status(404).json({
        message: "File not found"
      })
    }

    if (file.isDeleted) {
      return res.status(400).json({
        message: "Cannot rename deleted file"
      })
    }

    if (file.userId.toString() != req.user.id) {
      return res.status(401).json({
        message: "Unauthorized"
      })
    }

    const oldpath = path.join(__dirname, "..", file.path)

    // new file with the same extension 
    const ext = path.extname(file.originalname)
    const newfilename = newName.trim() + ext
    const newpath = path.join("uploads", newfilename)

    //rename file in storage
    await fs.rename(oldpath, path.join(__dirname, "..", newpath))

    //update db
    file.filename = newfilename
    file.path = newpath
    file.originalname = newfilename
    file.updatedAt = new Date()

    await file.save()

    await logActivity(req.user.id, "file_rename", "file", file._id, newfilename, `File renamed from ${path.basename(oldpath)}`, "success")

    return res.status(200).json({
      message: "File updated successfully",
      file: file
    })
  } catch (error) {
    console.error("Rename error:", error)
    await logActivity(req.user.id, "file_rename", "file", null, null, "File rename failed", "failure", error.message)
    return res.status(500).json({
      message: "file update failed",
      error: error.message
    })
  }
}

const movefile = async (req, res) => {
  try {
    const fileID = req.params.id
    const { folderId } = req.body

    // Validate folderId is provided
    if (!folderId) {
      return res.status(400).json({
        message: "Folder ID is required in request body"
      })
    }

    //find file
    const file = await File.findById(fileID)
    if (!file) {
      return res.status(404).json({
        message: "file not found"
      })
    }

    if (file.isDeleted) {
      return res.status(400).json({
        message: "Cannot move deleted file"
      })
    }

    //ownership check
    if (file.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "unauthorized"
      })
    }

    //Find target folder
    console.log("Looking for folder with ID:", folderId)
    const folder = await Folder.findById(folderId)

    if (!folder) {
      console.log("Folder not found in database for ID:", folderId)
      return res.status(404).json({
        message: "Folder not found - Make sure the folder ID is correct and created by this user"
      })
    }

    // check folder ownership
    if (folder.userID.toString() !== req.user.id) {
      return res.status(403).json({
        message: "unauthorized folder access"
      })
    }

    //move file
    file.folderId = folderId
    file.updatedAt = new Date()
    await file.save()

    await logActivity(req.user.id, "file_move", "file", file._id, file.originalname, `File moved to folder ${folder.name}`, "success")

    res.status(200).json({
      message: "File moved successfully"
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "move failed",
      error: error.message
    })
  }
}

const searchFiles = async (req, res) => {
  try {
    const { name, page = 1, limit = 5 } = req.query

    //search condition
    const searchQuery = {
      userId: req.user.id,
      isDeleted: false,
      originalname: {
        $regex: name || "",
        $options: "i"
      }
    }

    //pagination calculation
    const skip = (page - 1) * limit

    //fetch files
    const files = await File.find(searchQuery)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })

    //total count
    const total = await File.countDocuments(searchQuery)
    res.status(200).json({
      message: "Files fetched suceesfully",
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      files
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "search failed"
    })
  }
}

// Copy file
const copyFile = async (req, res) => {
  try {
    const fileID = req.params.id
    const { folderId = null } = req.body

    const file = await File.findById(fileID)

    if (!file) {
      return res.status(404).json({
        message: "File not found"
      })
    }

    if (file.isDeleted) {
      return res.status(400).json({
        message: "Cannot copy deleted file"
      })
    }

    if (file.userId.toString() != req.user.id) {
      return res.status(403).json({
        message: "unauthorized access"
      })
    }

    // Check storage quota
    const user = await User.findById(req.user.id)
    if (user.storageUsed + file.size > user.storageQuota) {
      return res.status(413).json({
        message: "Storage quota exceeded"
      })
    }

    const sourceFilePath = path.join(__dirname, "..", file.path)
    const newFilename = `${path.parse(file.originalname).name}_copy_${Date.now()}${path.extname(file.originalname)}`
    const newFilePath = path.join("uploads", newFilename)
    const newFileFullPath = path.join(__dirname, "..", newFilePath)

    // Copy file in storage
    await fs.copyFile(sourceFilePath, newFileFullPath)

    // Calculate hash of copied file
    const copiedFileHash = await calculateFileHash(newFileFullPath)

    const newFile = new File({
      filename: newFilename,
      originalname: newFilename,
      path: newFilePath,
      size: file.size,
      userId: req.user.id,
      folderId: folderId || file.folderId,
      hash: copiedFileHash,
      mimetype: file.mimetype,
      metadata: file.metadata,
      versions: [{
        hash: copiedFileHash,
        path: newFilePath,
        size: file.size,
        createdAt: new Date(),
        version: 1
      }]
    })

    const savedFile = await newFile.save()

    // Update user storage
    user.storageUsed += file.size
    await user.save()

    await logActivity(req.user.id, "file_copy", "file", savedFile._id, newFilename, `File copied from ${file.originalname}`, "success")

    res.status(201).json({
      message: "File copied successfully",
      file: savedFile
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "copy failed",
      error: error.message
    })
  }
}

// Get file versions
const getFileVersions = async (req, res) => {
  try {
    const fileID = req.params.id

    const file = await File.findById(fileID)

    if (!file) {
      return res.status(404).json({
        message: "File not found"
      })
    }

    if (file.userId.toString() != req.user.id) {
      return res.status(403).json({
        message: "unauthorized access"
      })
    }

    const versions = await FileVersion.find({ fileId: fileID })
      .sort({ version: -1 })

    res.status(200).json({
      message: "Versions fetched successfully",
      versions
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "failed to fetch versions"
    })
  }
}

// Restore file version
const restoreFileVersion = async (req, res) => {
  try {
    const fileID = req.params.id
    const versionID = req.params.versionId

    const file = await File.findById(fileID)

    if (!file) {
      return res.status(404).json({
        message: "File not found"
      })
    }

    if (file.userId.toString() != req.user.id) {
      return res.status(403).json({
        message: "unauthorized access"
      })
    }

    const version = await FileVersion.findById(versionID)

    if (!version || version.fileId.toString() !== fileID) {
      return res.status(404).json({
        message: "Version not found"
      })
    }

    const versionFilePath = path.join(__dirname, "..", version.path)
    const currentFilePath = path.join(__dirname, "..", file.path)

    // Check if version file exists
    try {
      await fs.access(versionFilePath)
    } catch {
      return res.status(404).json({
        message: "Version file not found in storage"
      })
    }

    // Store current version as backup
    const currentFileContent = await fs.readFile(currentFilePath)
    const currentFileHash = crypto.createHash('sha256').update(currentFileContent).digest('hex')

    const backupVersion = new FileVersion({
      fileId: fileID,
      userId: file.userId,
      hash: currentFileHash,
      path: file.path,
      size: file.size,
      version: Math.max(...file.versions.map(v => v.version)) + 1,
      reason: "Auto-backup before version restore"
    })
    await backupVersion.save()

    // Restore the version
    const versionContent = await fs.readFile(versionFilePath)
    await fs.writeFile(currentFilePath, versionContent)

    file.hash = version.hash
    file.size = version.size
    file.updatedAt = new Date()

    // Update versions array
    file.versions.unshift({
      hash: version.hash,
      path: version.path,
      size: version.size,
      createdAt: new Date(),
      version: Math.max(...file.versions.map(v => v.version)) + 1
    })

    // Keep only last 5 versions
    if (file.versions.length > 5) {
      file.versions = file.versions.slice(0, 5)
    }

    await file.save()

    version.restoredAt = new Date()
    await version.save()

    await logActivity(req.user.id, "file_restore", "file", fileID, file.originalname, `File restored from version ${version.version}`, "success")

    res.status(200).json({
      message: "Version restored successfully",
      file
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "restore failed",
      error: error.message
    })
  }
}

// Delete specific file version
const deleteFileVersion = async (req, res) => {
  try {
    const fileID = req.params.id
    const versionID = req.params.versionId

    const file = await File.findById(fileID)

    if (!file) {
      return res.status(404).json({
        message: "File not found"
      })
    }

    if (file.userId.toString() != req.user.id) {
      return res.status(403).json({
        message: "unauthorized access"
      })
    }

    const version = await FileVersion.findByIdAndDelete(versionID)

    if (!version) {
      return res.status(404).json({
        message: "Version not found"
      })
    }

    // Try to delete the version file from storage if it exists
    try {
      const versionFilePath = path.join(__dirname, "..", version.path)
      await fs.unlink(versionFilePath)
    } catch (err) {
      console.warn("Could not delete version file from storage:", err.message)
    }

    await logActivity(req.user.id, "file_version_delete", "file", fileID, file.originalname, `Version ${version.version} deleted`, "success")

    res.status(200).json({
      message: "Version deleted successfully"
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "delete failed",
      error: error.message
    })
  }
}

// Get trash/deleted files
const getTrash = async (req, res) => {
  try {
    const trash = await Trash.find({ userId: req.user.id })
      .sort({ deletedAt: -1 })
      .populate('fileId', 'originalname size')

    res.status(200).json({
      message: "Trash fetched successfully",
      trash
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "failed to fetch trash"
    })
  }
}

// Restore file from trash
const restoreFromTrash = async (req, res) => {
  try {
    const trashID = req.params.id

    const trash = await Trash.findById(trashID)

    if (!trash) {
      return res.status(404).json({
        message: "Trash item not found"
      })
    }

    if (trash.userId.toString() != req.user.id) {
      return res.status(403).json({
        message: "unauthorized access"
      })
    }

    const file = await File.findById(trash.fileId)

    if (!file) {
      return res.status(404).json({
        message: "Original file not found"
      })
    }

    // Check if file still exists in storage
    const filePath = path.join(__dirname, "..", file.path)
    try {
      await fs.access(filePath)
    } catch {
      return res.status(400).json({
        message: "File no longer exists in storage"
      })
    }

    // Restore file
    file.isDeleted = false
    file.deletedAt = null
    file.folderId = trash.originalFolder
    await file.save()

    // Restore storage usage (file no longer in trash)
    const user = await User.findById(trash.userId)
    user.storageUsed += trash.size
    await user.save()

    // Remove from trash
    await Trash.findByIdAndDelete(trashID)

    await logActivity(req.user.id, "file_restore", "file", file._id, file.originalname, "File restored from trash", "success")

    res.status(200).json({
      message: "File restored successfully",
      file
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "restore failed",
      error: error.message
    })
  }
}

// Permanently delete file
const permanentlyDeleteFile = async (req, res) => {
  try {
    const trashID = req.params.id

    const trash = await Trash.findById(trashID)

    if (!trash) {
      return res.status(404).json({
        message: "Trash item not found"
      })
    }

    if (trash.userId.toString() != req.user.id) {
      return res.status(403).json({
        message: "unauthorized access"
      })
    }

    const file = await File.findById(trash.fileId)

    if (!file) {
      // Trash item exists but file is already deleted from DB
      await Trash.findByIdAndDelete(trashID)
      return res.status(200).json({
        message: "Trash item cleaned"
      })
    }

    const filePath = path.join(__dirname, "..", file.path)

    // Delete file from storage
    try {
      await fs.unlink(filePath)
    } catch (err) {
      console.warn("File not found in storage:", err.message)
    }

    // Delete file versions from storage and DB
    const versions = await FileVersion.find({ fileId: file._id })
    for (const version of versions) {
      try {
        const versionPath = path.join(__dirname, "..", version.path)
        await fs.unlink(versionPath)
      } catch (err) {
        console.warn("Version file not found in storage:", err.message)
      }
    }
    await FileVersion.deleteMany({ fileId: file._id })

    // Delete from DB
    await File.findByIdAndDelete(file._id)

    // Remove from trash
    await Trash.findByIdAndDelete(trashID)

    // Update user's storage
    const user = await User.findById(file.userId)
    user.storageUsed = Math.max(0, user.storageUsed - file.size)
    await user.save()

    await logActivity(req.user.id, "file_delete", "file", file._id, file.originalname, "File permanently deleted", "success")

    res.status(200).json({
      message: "File permanently deleted"
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "delete failed",
      error: error.message
    })
  }
}

// Empty all trash
const emptyTrash = async (req, res) => {
  try {
    // Get all trash items for this user
    const trashItems = await Trash.find({ userId: req.user.id })

    let deletedCount = 0
    let errorCount = 0

    // Permanently delete each item
    for (const trash of trashItems) {
      try {
        const file = await File.findById(trash.fileId)

        if (file) {
          const filePath = path.join(__dirname, "..", file.path)

          // Delete file from storage
          try {
            await fs.unlink(filePath)
          } catch (err) {
            console.warn("File not found in storage:", err.message)
          }

          // Delete file versions
          const versions = await FileVersion.find({ fileId: file._id })
          for (const version of versions) {
            try {
              const versionPath = path.join(__dirname, "..", version.path)
              await fs.unlink(versionPath)
            } catch (err) {
              console.warn("Version file not found in storage:", err.message)
            }
          }
          await FileVersion.deleteMany({ fileId: file._id })

          // Update user's storage
          const user = await User.findById(file.userId)
          user.storageUsed = Math.max(0, user.storageUsed - file.size)
          await user.save()

          // Delete from DB
          await File.findByIdAndDelete(file._id)
        }

        // Remove from trash
        await Trash.findByIdAndDelete(trash._id)
        deletedCount++
      } catch (err) {
        console.error("Error deleting trash item:", err)
        errorCount++
      }
    }

    await logActivity(req.user.id, "file_delete", "file", null, "Trash", `Emptied trash - ${deletedCount} files deleted`, "success")

    res.status(200).json({
      message: `Trash emptied - ${deletedCount} files deleted`,
      deletedCount,
      errorCount
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "empty trash failed",
      error: error.message
    })
  }
}

// Batch operations
const batchFileOperation = async (req, res) => {
  try {
    const { action, fileIds, destination } = req.body

    if (!action || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        message: "action and non-empty fileIds array required"
      })
    }

    const results = []

    switch (action.toLowerCase()) {
      case 'delete':
        // Batch delete to trash
        for (const fileID of fileIds) {
          try {
            const file = await File.findById(fileID)

            if (!file) {
              results.push({ fileId: fileID, success: false, message: "File not found" })
              continue
            }

            if (file.userId.toString() != req.user.id) {
              results.push({ fileId: fileID, success: false, message: "unauthorized" })
              continue
            }

            if (file.isDeleted) {
              results.push({ fileId: fileID, success: false, message: "Already deleted" })
              continue
            }

            // Move to trash
            const trash = new Trash({
              fileId: file._id,
              userId: file.userId,
              originalPath: file.path,
              originalFolder: file.folderId,
              filename: file.originalname,
              size: file.size,
              reason: "Batch delete"
            })
            await trash.save()

            file.isDeleted = true
            file.deletedAt = new Date()
            await file.save()

            await logActivity(req.user.id, "file_delete", "file", file._id, file.originalname, "Batch delete", "success")

            results.push({ fileId: fileID, success: true, message: "Deleted" })
          } catch (err) {
            console.error(err)
            results.push({ fileId: fileID, success: false, message: err.message })
          }
        }
        break

      case 'move':
        // Batch move
        if (!destination) {
          return res.status(400).json({
            message: "destination folder ID required for move operation"
          })
        }

        // Verify destination folder exists and belongs to user
        const destFolder = await Folder.findById(destination)
        if (!destFolder) {
          return res.status(404).json({
            message: "Destination folder not found"
          })
        }

        if (destFolder.userID.toString() !== req.user.id) {
          return res.status(403).json({
            message: "unauthorized folder access"
          })
        }

        for (const fileID of fileIds) {
          try {
            const file = await File.findById(fileID)

            if (!file) {
              results.push({ fileId: fileID, success: false, message: "File not found" })
              continue
            }

            if (file.userId.toString() != req.user.id) {
              results.push({ fileId: fileID, success: false, message: "unauthorized" })
              continue
            }

            if (file.isDeleted) {
              results.push({ fileId: fileID, success: false, message: "Cannot move deleted file" })
              continue
            }

            file.folderId = destination
            file.updatedAt = new Date()
            await file.save()

            await logActivity(req.user.id, "file_move", "file", file._id, file.originalname, `Batch moved to ${destFolder.name}`, "success")

            results.push({ fileId: fileID, success: true, message: "Moved" })
          } catch (err) {
            console.error(err)
            results.push({ fileId: fileID, success: false, message: err.message })
          }
        }
        break

      case 'copy':
        // Batch copy
        if (!destination) {
          return res.status(400).json({
            message: "destination folder ID required for copy operation"
          })
        }

        const destCopyFolder = await Folder.findById(destination)
        if (!destCopyFolder) {
          return res.status(404).json({
            message: "Destination folder not found"
          })
        }

        if (destCopyFolder.userID.toString() !== req.user.id) {
          return res.status(403).json({
            message: "unauthorized folder access"
          })
        }

        const user = await User.findById(req.user.id)

        for (const fileID of fileIds) {
          try {
            const file = await File.findById(fileID)

            if (!file) {
              results.push({ fileId: fileID, success: false, message: "File not found" })
              continue
            }

            if (file.userId.toString() != req.user.id) {
              results.push({ fileId: fileID, success: false, message: "unauthorized" })
              continue
            }

            if (file.isDeleted) {
              results.push({ fileId: fileID, success: false, message: "Cannot copy deleted file" })
              continue
            }

            // Check storage quota
            if (user.storageUsed + file.size > user.storageQuota) {
              results.push({ fileId: fileID, success: false, message: "Storage quota exceeded" })
              continue
            }

            const sourceFilePath = path.join(__dirname, "..", file.path)
            const newFilename = `${path.parse(file.originalname).name}_copy_${Date.now()}${path.extname(file.originalname)}`
            const newFilePath = path.join("uploads", newFilename)
            const newFileFullPath = path.join(__dirname, "..", newFilePath)

            // Copy file
            await fs.copyFile(sourceFilePath, newFileFullPath)

            // Calculate hash
            const copiedFileHash = await calculateFileHash(newFileFullPath)

            const newFile = new File({
              filename: newFilename,
              originalname: newFilename,
              path: newFilePath,
              size: file.size,
              userId: req.user.id,
              folderId: destination,
              hash: copiedFileHash,
              mimetype: file.mimetype,
              versions: [{
                hash: copiedFileHash,
                path: newFilePath,
                size: file.size,
                createdAt: new Date(),
                version: 1
              }]
            })

            await newFile.save()

            user.storageUsed += file.size
            await user.save()

            await logActivity(req.user.id, "file_copy", "file", newFile._id, newFilename, `Batch copied from ${file.originalname}`, "success")

            results.push({ fileId: fileID, success: true, message: "Copied", newFileId: newFile._id })
          } catch (err) {
            console.error(err)
            results.push({ fileId: fileID, success: false, message: err.message })
          }
        }
        break

      default:
        return res.status(400).json({
          message: "Invalid action. Supported: delete, move, copy"
        })
    }

    res.status(200).json({
      message: `Batch ${action} completed`,
      action,
      results
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "batch operation failed",
      error: error.message
    })
  }
}

module.exports = {
  uploadFile,
  getFiles,
  downloadfile,
  deleteFile,
  renamefile,
  movefile,
  searchFiles,
  copyFile,
  getFileVersions,
  restoreFileVersion,
  deleteFileVersion,
  getTrash,
  restoreFromTrash,
  permanentlyDeleteFile,
  emptyTrash,
  batchFileOperation
}