const express = require("express")

const router = express.Router()

const { createFolder, getfolder, deleteFolder,getFolderTree } = require("../controllers/folderController")

const authmiddleware = require("../middleware/authMiddleware")

router.post("/", authmiddleware, createFolder)

router.get("/", authmiddleware, getfolder)

router.delete("/:id",authmiddleware,deleteFolder)

router.get("/tree", authmiddleware ,getFolderTree)


module.exports = router