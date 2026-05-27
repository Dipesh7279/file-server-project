const express = require("express");
const {
  register,
  verifyEmail,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  logout
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter, passwordResetLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Public routes
router.post("/register", registerLimiter, register);
router.post("/verify-email", verifyEmail);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshAccessToken);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes (require authentication)
router.post("/change-password", authMiddleware, changePassword);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/logout", authMiddleware, logout);

module.exports = router;
