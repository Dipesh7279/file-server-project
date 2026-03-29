

const express= require("express")

const router= express.Router();

const upload = require("../config/multer")

const authmiddleware = require("../middleware/authMiddleware");

const {uploadFile,getFiles} = require("../controllers/fileController")


//upload route

router.post("/upload",authmiddleware,upload.single("file"),uploadFile);

router.get("/",authmiddleware,getFiles)


module.exports = router;