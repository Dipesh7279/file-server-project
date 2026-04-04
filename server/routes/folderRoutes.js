const express = require("express")

const router = express.Router()

const {createFolder} = require("../controllers/folderController")

const authmiddleware = require("../middleware/authMiddleware")

router.post("/",authmiddleware,createFolder)

module.exports = router