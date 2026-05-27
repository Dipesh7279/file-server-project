const express = require("express");
const router = express.Router();

const authmiddleware = require("../middleware/authMiddleware");

const {
  createShareLink,
  getShareLink,
  downloadSharedFile,
  shareWithUsers,
  updateShareLink,
  getUserShareLinks,
  deleteShareLink
} = require("../controllers/shareController");

// Protected routes - require authentication
router.post("/", authmiddleware, createShareLink);
router.get("/my-shares", authmiddleware, getUserShareLinks);
router.put("/:shareLinkId", authmiddleware, updateShareLink);
router.delete("/:shareLinkId", authmiddleware, deleteShareLink);
router.post("/:fileId/share-with-users", authmiddleware, shareWithUsers);

// Public routes - no authentication required
router.post("/public/:token/access", getShareLink);
router.post("/public/:token/download", downloadSharedFile);

module.exports = router;
