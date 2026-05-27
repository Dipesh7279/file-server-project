const express = require("express");
const router = express.Router();

const authmiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");

const {
  promoteToAdmin,
  demoteAdmin,
  getAllUsers,
  suspendUser,
  reactivateUser,
  resetUserPassword,
  deleteUser,
  getStorageStats,
  getActivityLogs,
  getSystemStats,
  updateUserStorageQuota,
  getUserStorageDetails,
  deleteUserFiles,
  getSystemHealth
} = require("../controllers/adminController");

// Middleware to check if user is admin (role-based)
const isAdminRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required"
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Authorization check failed" });
  }
};

// User management (all protected routes)
router.post("/promote-admin", authmiddleware, isAdminRole, promoteToAdmin);
router.delete("/demote-admin/:adminId", authmiddleware, isAdminRole, demoteAdmin);
router.get("/users", authmiddleware, isAdminRole, getAllUsers);
router.put("/users/:userId/suspend", authmiddleware, isAdminRole, suspendUser);
router.put("/users/:userId/reactivate", authmiddleware, isAdminRole, reactivateUser);
router.post("/users/:userId/reset-password", authmiddleware, isAdminRole, resetUserPassword);
router.delete("/users/:userId", authmiddleware, isAdminRole, deleteUser);

// Statistics and monitoring
router.get("/storage-stats", authmiddleware, isAdminRole, getStorageStats);
router.get("/activity-logs", authmiddleware, isAdminRole, getActivityLogs);
router.get("/system-stats", authmiddleware, isAdminRole, getSystemStats);
router.get("/system-health", authmiddleware, isAdminRole, getSystemHealth);

// Advanced admin features
router.put("/users/:userId/storage-quota", authmiddleware, isAdminRole, updateUserStorageQuota);
router.get("/users/:userId/storage-details", authmiddleware, isAdminRole, getUserStorageDetails);
router.delete("/users/:userId/files", authmiddleware, isAdminRole, deleteUserFiles);

module.exports = router;
