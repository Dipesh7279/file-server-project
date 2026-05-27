const express = require("express")

const router = express.Router()

const upload = require("../config/multer")

const authmiddleware = require("../middleware/authMiddleware")

const {
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
} = require("../controllers/fileController")

// File operations
router.post("/upload", authmiddleware, upload.single("file"), uploadFile)
router.get("/", authmiddleware, getFiles)
router.get("/download/:id", authmiddleware, downloadfile)
router.delete("/:id", authmiddleware, deleteFile)
router.put("/rename/:id", authmiddleware, renamefile)
router.put("/move/:id", authmiddleware, movefile)
router.get("/search", authmiddleware, searchFiles)
router.post("/:id/copy", authmiddleware, copyFile)

// Batch operations
router.post("/batch", authmiddleware, batchFileOperation)

// File versioning
router.get("/:id/versions", authmiddleware, getFileVersions)
router.post("/:id/versions/:versionId/restore", authmiddleware, restoreFileVersion)
router.delete("/:id/versions/:versionId", authmiddleware, deleteFileVersion)

// Trash/Recycle bin
router.get("/trash", authmiddleware, getTrash)
router.post("/trash/:id/restore", authmiddleware, restoreFromTrash)
router.delete("/trash/:id", authmiddleware, permanentlyDeleteFile)
router.delete("/trash", authmiddleware, emptyTrash)

module.exports = router