const User = require("../models/user");
const Admin = require("../models/Admin");
const File = require("../models/File");
const ActivityLog = require("../models/ActivityLog");
const { Folder } = require("../models/Folder");

// Middleware to check if user is admin
const isAdmin = async (userId) => {
  const admin = await Admin.findOne({ userId, isActive: true });
  return !!admin;
};

// Middleware to check specific permission
const hasPermission = async (userId, permission) => {
  // First check role-based system (simpler)
  const user = await User.findById(userId);
  if (user && user.role === 'admin') return true;

  // Fallback to Admin collection permissions (complex)
  const admin = await Admin.findOne({ userId, isActive: true });
  if (!admin) return false;

  if (admin.role === 'super_admin') return true;

  return admin.permissions.includes(permission);
};

// Promote user to admin
const promoteToAdmin = async (req, res) => {
  try {
    const { userId, role = 'admin', permissions = [] } = req.body;

    // Check if requester is super_admin
    const requesterAdmin = await Admin.findOne({ userId: req.user.id });
    if (!requesterAdmin || requesterAdmin.role !== 'super_admin') {
      return res.status(403).json({
        message: "Only super admins can promote users"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Check if already admin
    const existingAdmin = await Admin.findOne({ userId });
    if (existingAdmin) {
      return res.status(400).json({
        message: "User is already an admin"
      });
    }

    // Update user role and storage quota
    user.role = 'admin';
    user.storageQuota = 1073741824; // 1GB for admin
    await user.save();

    const admin = new Admin({
      userId,
      role,
      permissions
    });

    await admin.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "admin_promote",
      resourceType: "user",
      resourceId: userId,
      resourceName: user.username,
      description: `User promoted to ${role}`,
      status: "success"
    });

    res.status(201).json({
      message: "User promoted to admin successfully",
      admin,
      user: {
        username: user.username,
        role: user.role,
        storageQuota: user.storageQuota
      }
    });
  } catch (error) {
    console.error("Promote admin error:", error);
    res.status(500).json({
      message: "Failed to promote user",
      error: error.message
    });
  }
};

// Demote admin to regular user
const demoteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Check if requester is super_admin
    const requesterAdmin = await Admin.findOne({ userId: req.user.id });
    if (!requesterAdmin || requesterAdmin.role !== 'super_admin') {
      return res.status(403).json({
        message: "Only super admins can demote admins"
      });
    }

    const admin = await Admin.findById(adminId).populate('userId', 'username');
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found"
      });
    }

    // Update user role and storage quota back to regular user
    const user = await User.findById(admin.userId._id);
    if (user) {
      user.role = 'user';
      user.storageQuota = 104857600; // 100MB for regular user
      await user.save();
    }

    await Admin.findByIdAndDelete(adminId);

    await ActivityLog.create({
      userId: req.user.id,
      action: "admin_demote",
      resourceType: "user",
      resourceId: admin.userId._id,
      resourceName: admin.userId.username,
      description: "Admin demoted to regular user",
      status: "success"
    });

    res.status(200).json({
      message: "Admin demoted successfully"
    });
  } catch (error) {
    console.error("Demote admin error:", error);
    res.status(500).json({
      message: "Failed to demote admin",
      error: error.message
    });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", sortBy = "createdAt", order = "desc" } = req.query;

    const skip = (page - 1) * limit;

    const searchQuery = {
      $or: [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    };

    const users = await User.find(searchQuery)
      .select('-passwordHash -refreshTokens')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(searchQuery);

    // Get admin status for each user
    const usersWithAdminStatus = await Promise.all(users.map(async (user) => {
      const admin = await Admin.findOne({ userId: user._id });
      return {
        ...user._doc,
        isAdmin: !!admin,
        adminRole: admin?.role
      };
    }));

    res.status(200).json({
      message: "Users fetched successfully",
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      users: usersWithAdminStatus
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

// Suspend user (admin only)
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = null } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.isActive = false;
    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "user_suspend",
      resourceType: "user",
      resourceId: userId,
      resourceName: user.username,
      description: `User suspended${reason ? `: ${reason}` : ''}`,
      status: "success"
    });

    res.status(200).json({
      message: "User suspended successfully"
    });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({
      message: "Failed to suspend user",
      error: error.message
    });
  }
};

// Reactivate user (admin only)
const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.isActive = true;
    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "user_reactivate",
      resourceType: "user",
      resourceId: userId,
      resourceName: user.username,
      description: "User reactivated",
      status: "success"
    });

    res.status(200).json({
      message: "User reactivated successfully"
    });
  } catch (error) {
    console.error("Reactivate user error:", error);
    res.status(500).json({
      message: "Failed to reactivate user",
      error: error.message
    });
  }
};

// Reset user password (admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10).toUpperCase();

    // In real implementation, hash and save to DB, then email to user
    // For now, return the temp password for admin to send manually

    await ActivityLog.create({
      userId: req.user.id,
      action: "user_password_reset",
      resourceType: "user",
      resourceId: userId,
      resourceName: user.username,
      description: "Admin initiated password reset",
      status: "success"
    });

    res.status(200).json({
      message: "Password reset initiated",
      tempPassword: tempPassword,
      note: "Send this password to the user securely"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Failed to reset password",
      error: error.message
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Delete user's files
    const files = await File.find({ userId });
    for (const file of files) {
      await File.findByIdAndDelete(file._id);
    }

    // Delete user's folders
    await Folder.deleteMany({ userID: userId });

    // Delete user's activity logs
    await ActivityLog.deleteMany({ userId });

    // Delete user's admin role if exists
    await Admin.deleteOne({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    await ActivityLog.create({
      userId: req.user.id,
      action: "user_delete",
      resourceType: "user",
      resourceId: userId,
      resourceName: user.username,
      description: "User account and all associated data deleted",
      status: "success"
    });

    res.status(200).json({
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message
    });
  }
};

// Get storage statistics (admin only)
const getStorageStats = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const users = await User.find().select('storageUsed storageQuota');
    const totalStorageUsed = users.reduce((sum, user) => sum + user.storageUsed, 0);
    const totalStorageQuota = users.reduce((sum, user) => sum + user.storageQuota, 0);

    const totalFiles = await File.countDocuments({ isDeleted: false });

    const topUsers = await User.find()
      .select('username email storageUsed storageQuota')
      .sort({ storageUsed: -1 })
      .limit(10);

    res.status(200).json({
      message: "Storage statistics fetched",
      stats: {
        totalUsers,
        activeUsers,
        totalFiles,
        totalStorageUsed,
        totalStorageQuota,
        storagePercentageUsed: ((totalStorageUsed / totalStorageQuota) * 100).toFixed(2),
        topStorageUsers: topUsers
      }
    });
  } catch (error) {
    console.error("Storage stats error:", error);
    res.status(500).json({
      message: "Failed to fetch storage statistics",
      error: error.message
    });
  }
};

// Get activity logs (admin only)
const getActivityLogs = async (req, res) => {
  try {

    const { page = 1, limit = 50, action = "", userId = "", status = "" } = req.query;

    const skip = (page - 1) * limit;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const logs = await ActivityLog.find(filter)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ActivityLog.countDocuments(filter);

    res.status(200).json({
      message: "Activity logs fetched",
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      logs
    });
  } catch (error) {
    console.error("Activity logs error:", error);
    res.status(500).json({
      message: "Failed to fetch activity logs",
      error: error.message
    });
  }
};

// Get system statistics (admin only)
const getSystemStats = async (req, res) => {
  try {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });

    const totalLogs = await ActivityLog.countDocuments();
    const logsToday = await ActivityLog.countDocuments({
      createdAt: { $gte: today }
    });

    const actionStats = await ActivityLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      message: "System statistics fetched",
      stats: {
        newUsersToday,
        totalLogs,
        logsToday,
        actionStats
      }
    });
  } catch (error) {
    console.error("System stats error:", error);
    res.status(500).json({
      message: "Failed to fetch system statistics",
      error: error.message
    });
  }
};

// Update user storage quota (admin only)
const updateUserStorageQuota = async (req, res) => {
  try {
    const { userId } = req.params;
    const { storageQuota } = req.body;

    if (!storageQuota || storageQuota <= 0) {
      return res.status(400).json({
        message: "Storage quota must be a positive number"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const oldQuota = user.storageQuota;
    user.storageQuota = storageQuota;
    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "storage_quota_update",
      resourceType: "user",
      resourceId: userId,
      resourceName: user.username,
      description: `Storage quota updated from ${oldQuota} to ${storageQuota} bytes`,
      status: "success"
    });

    res.status(200).json({
      message: "Storage quota updated successfully",
      user: {
        username: user.username,
        newQuota: user.storageQuota,
        newQuotaGB: (user.storageQuota / (1024 * 1024 * 1024)).toFixed(2),
        storageUsed: user.storageUsed,
        storageUsedGB: (user.storageUsed / (1024 * 1024 * 1024)).toFixed(2)
      }
    });
  } catch (error) {
    console.error("Update storage quota error:", error);
    res.status(500).json({
      message: "Failed to update storage quota",
      error: error.message
    });
  }
};

// Get detailed user storage info (admin only)
const getUserStorageDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Get user's files
    const userFiles = await File.find({ userId, isDeleted: false });
    const totalFiles = userFiles.length;
    const totalFileSize = userFiles.reduce((sum, file) => sum + (file.size || 0), 0);

    // Get user's folders
    const userFolders = await Folder.find({ userID: userId }).countDocuments();

    const quotaMB = (user.storageQuota / (1024 * 1024)).toFixed(0);
    const usedMB = (user.storageUsed / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (totalFileSize / (1024 * 1024)).toFixed(2);
    const percentUsed = ((user.storageUsed / user.storageQuota) * 100).toFixed(1);

    res.status(200).json({
      message: "User storage details fetched",
      details: {
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        storageInfo: {
          quotaMB,
          usedMB,
          percentUsed: `${percentUsed}%`,
          availableMB: ((user.storageQuota - user.storageUsed) / (1024 * 1024)).toFixed(2)
        },
        fileInfo: {
          totalFiles,
          totalFileSize: fileSizeMB,
          totalFolders: userFolders
        },
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error("Get storage details error:", error);
    res.status(500).json({
      message: "Failed to fetch storage details",
      error: error.message
    });
  }
};

// Delete user files (admin only)
const deleteUserFiles = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Get user's files
    const files = await File.find({ userId });
    let deletedCount = 0;
    let freedSpace = 0;

    for (const file of files) {
      deletedCount++;
      freedSpace += file.size || 0;
      await File.findByIdAndDelete(file._id);
    }

    // Update user's storage
    user.storageUsed = Math.max(0, user.storageUsed - freedSpace);
    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "user_files_deleted",
      resourceType: "user",
      resourceId: userId,
      resourceName: user.username,
      description: `${deletedCount} files deleted, freed ${(freedSpace / (1024 * 1024)).toFixed(2)} MB`,
      status: "success"
    });

    res.status(200).json({
      message: "User files deleted successfully",
      result: {
        deletedFiles: deletedCount,
        freedSpaceMB: (freedSpace / (1024 * 1024)).toFixed(2),
        userStorageNowMB: (user.storageUsed / (1024 * 1024)).toFixed(2)
      }
    });
  } catch (error) {
    console.error("Delete user files error:", error);
    res.status(500).json({
      message: "Failed to delete user files",
      error: error.message
    });
  }
};

// Get system health (admin only)
const getSystemHealth = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const suspendedUsers = totalUsers - activeUsers;

    const totalFiles = await File.countDocuments({ isDeleted: false });
    const deletedFiles = await File.countDocuments({ isDeleted: true });

    const users = await User.find().select('storageQuota storageUsed');
    const totalQuota = users.reduce((sum, u) => sum + u.storageQuota, 0);
    const totalUsed = users.reduce((sum, u) => sum + u.storageUsed, 0);
    const totalAvailable = totalQuota - totalUsed;

    const storagePercentage = ((totalUsed / totalQuota) * 100).toFixed(2);

    const logCount = await ActivityLog.countDocuments();

    res.status(200).json({
      message: "System health fetched",
      health: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          suspendedPercentage: ((suspendedUsers / totalUsers) * 100).toFixed(1)
        },
        files: {
          total: totalFiles,
          deleted: deletedFiles,
          active: totalFiles
        },
        storage: {
          totalQuotaGB: (totalQuota / (1024 * 1024 * 1024)).toFixed(2),
          usedGB: (totalUsed / (1024 * 1024 * 1024)).toFixed(2),
          availableGB: (totalAvailable / (1024 * 1024 * 1024)).toFixed(2),
          usagePercentage: `${storagePercentage}%`
        },
        logs: {
          total: logCount
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error("System health error:", error);
    res.status(500).json({
      message: "Failed to fetch system health",
      error: error.message
    });
  }
};

module.exports = {
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
  getSystemHealth,
  isAdmin,
  hasPermission
};
