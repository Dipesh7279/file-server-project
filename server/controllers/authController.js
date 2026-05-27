const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username) => {
  if (typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 30) return false;
  return /^[a-zA-Z0-9_-]+$/.test(username);
};

const validatePassword = (password) => {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  return /[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
};

const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
};

// Generate JWT tokens
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// Enhanced register user
const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log('Register attempt - Username:', username, 'Type:', typeof username, 'Length:', username.length);
    console.log('Username validation - regex test:', /^[a-zA-Z0-9_-]+$/.test(username));
    console.log('Username validation - length check:', username.length >= 3 && username.length <= 30);

    if (!validateUsername(username)) {
      console.log('Username validation FAILED for:', username);
      return res.status(400).json({
        message: "Username must be 3-30 characters, alphanumeric with dashes/underscores only"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password must be 8+ chars with uppercase, number, and special character",
        strength: getPasswordStrength(password)
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.username === username ?
          "Username already exists" :
          "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user - Auto-verify email in development mode for testing
    const isDevMode = process.env.NODE_ENV !== 'production';

    // Set storage quota based on role (default is 'user')
    const storageQuota = 104857600; // 100MB for regular users

    const user = new User({
      username,
      email,
      password: hashedPassword,
      storageQuota, // Explicitly set quota for user
      emailVerificationToken: isDevMode ? null : emailVerificationToken,
      emailVerificationExpires: isDevMode ? null : new Date(Date.now() + 24 * 60 * 60 * 1000),
      isEmailVerified: isDevMode ? true : false // Auto-verify in dev mode
    });

    await user.save();

    // TODO: Send verification email (implement emailService later)
    if (!isDevMode) {
      console.log(`Email verification token for ${email}: ${emailVerificationToken}`);
    }

    return res.status(201).json({
      message: isDevMode ? "Account created successfully! You can now login." : "Registration successful. Please verify your email.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      },
      verificationTokenForDev: !isDevMode ? emailVerificationToken : null
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    return res.status(500).json({ message: "Registration failed: " + err.message });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Verification token required" });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error("Email verification error:", err.message);
    return res.status(500).json({ message: "Verification failed: " + err.message });
  }
};

// Enhanced login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        message: `Account locked. Try again in ${minutesLeft} minutes`,
        remainingTime: minutesLeft
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        email: user.email
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await user.save();

      return res.status(401).json({
        message: "Invalid credentials",
        attemptsRemaining: Math.max(0, 5 - user.loginAttempts)
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });

    // Keep only last 10 refresh tokens
    if (user.refreshTokens.length > 10) {
      user.refreshTokens = user.refreshTokens.slice(-10);
    }

    await user.save();

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin"
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Login failed: " + err.message });
  }
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);

    if (!tokenExists) {
      return res.status(401).json({ message: "Refresh token invalid or revoked" });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });

    if (user.refreshTokens.length > 10) {
      user.refreshTokens = user.refreshTokens.slice(-10);
    }

    await user.save();

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error("Token refresh error:", err.message);
    return res.status(401).json({ message: "Token refresh failed: " + err.message });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        message: "If email exists, password reset link has been sent"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save();

    // TODO: Send reset email (implement emailService later)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return res.status(200).json({
      message: "If email exists, password reset link has been sent",
      resetTokenForDev: resetToken // Remove in production
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    return res.status(500).json({ message: "Request failed: " + err.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: "Password must be 8+ chars with uppercase, number, and special character",
        strength: getPasswordStrength(newPassword)
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // Clear all refresh tokens to force re-login on other devices
    user.refreshTokens = [];

    await user.save();

    return res.status(200).json({
      message: "Password reset successful. Please login with new password"
    });
  } catch (err) {
    console.error("Reset password error:", err.message);
    return res.status(500).json({ message: "Reset failed: " + err.message });
  }
};

// Change password (authenticated endpoint)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: "New password must be 8+ chars with uppercase, number, and special character",
        strength: getPasswordStrength(newPassword)
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from current" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error("Change password error:", err.message);
    return res.status(500).json({ message: "Change failed: " + err.message });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert to JSON and add isAdmin property
    const userObj = user.toObject ? user.toObject() : user;
    userObj.isAdmin = user.role === "admin";

    return res.status(200).json({
      message: "Profile retrieved successfully",
      user: userObj
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    return res.status(500).json({ message: "Failed to retrieve profile: " + err.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, username } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update email
    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      user.email = email;
      user.isEmailVerified = false;
      user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // Update username
    if (username && username !== user.username) {
      if (!validateUsername(username)) {
        return res.status(400).json({
          message: "Username must be 3-30 characters, alphanumeric with dashes/underscores only"
        });
      }

      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      user.username = username;
    }

    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    return res.status(500).json({ message: "Update failed: " + err.message });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      await user.save();
    }

    return res.status(200).json({
      message: "Logout successful"
    });
  } catch (err) {
    console.error("Logout error:", err.message);
    return res.status(500).json({ message: "Logout failed: " + err.message });
  }
};

module.exports = {
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
};
