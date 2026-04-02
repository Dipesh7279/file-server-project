
const express= require("express")

const router= express.Router();

const upload = require("../config/multer");

const authmiddleware = require("../middleware/authMiddleware");

const {uploadFile,getFiles,downloadfile,deleteFile} = require("../controllers/fileController")


//upload route

router.post("/upload",authmiddleware,upload.single("file"),uploadFile);


//Get files route
router.get("/",authmiddleware,getFiles)

//Download route
router.get("/download/:id",authmiddleware,downloadfile)

//delete route
router.delete("/:id",authmiddleware,deleteFile)


module.exports = router;