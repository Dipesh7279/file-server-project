const crypto = require("crypto");
const path = require("path");
const fs = require("fs").promises;
const File = require("../models/File");
const { Folder } = require("../models/Folder");
const ShareLink = require("../models/ShareLink");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/user");
const bcryptjs = require("bcryptjs");

// Generate unique share token
const generateShareToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Log sharing activity
const logActivity = async (userId, action, resourceType, resourceId, resourceName, description, status = "success", errorMessage = null) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      resourceType,
      resourceId,
      resourceName,
      description,
      status,
      errorMessage
    });
  } catch (err) {
    console.error("Activity logging failed:", err);
  }
};

// Create public share link
const createShareLink = async (req, res) => {
  try {
    const { fileId, folderId, shareType = 'private', accessType = 'view', password = null, expiresAt = null, maxDownloads = null } = req.body;

    if (!fileId && !folderId) {
      return res.status(400).json({
        message: "fileId or folderId is required"
      });
    }

    let resource = null;
    let resourceType = null;

    if (fileId) {
      resource = await File.findById(fileId);
      resourceType = 'file';

      if (!resource) {
        return res.status(404).json({
          message: "File not found"
        });
      }

      // Verify ownership
      if (resource.userId.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Unauthorized - you don't own this file"
        });
      }
    } else if (folderId) {
      resource = await Folder.findById(folderId);
      resourceType = 'folder';

      if (!resource) {
        return res.status(404).json({
          message: "Folder not found"
        });
      }

      // Verify ownership
      if (resource.userID.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Unauthorized - you don't own this folder"
        });
      }
    }

    // Validate access type
    const validAccessTypes = ['view', 'download', 'upload'];
    if (!validAccessTypes.includes(accessType)) {
      return res.status(400).json({
        message: "Invalid accessType. Must be: view, download, or upload"
      });
    }

    const token = generateShareToken();
    let hashedPassword = null;

    if (password) {
      hashedPassword = await bcryptjs.hash(password, 10);
    }

    const shareLink = new ShareLink({
      fileId: fileId || undefined,
      folderId: folderId || undefined,
      createdBy: req.user.id,
      token,
      shareType,
      accessType,
      password: hashedPassword,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxDownloads: maxDownloads
    });

    await shareLink.save();

    await logActivity(req.user.id, "share_create", resourceType, resource._id, resource.name || resource.originalname, `Shared with ${shareType} access`, "success");

    res.status(201).json({
      message: "Share link created successfully",
      shareLink: {
        _id: shareLink._id,
        token: shareLink.token,
        shareType: shareLink.shareType,
        accessType: shareLink.accessType,
        expiresAt: shareLink.expiresAt,
        maxDownloads: shareLink.maxDownloads,
        shareUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/share/${shareLink.token}`
      }
    });
  } catch (error) {
    console.error("Share creation error:", error);
    await logActivity(req.user.id, "share_create", "file", null, null, "Share creation failed", "failure", error.message);
    res.status(500).json({
      message: "Failed to create share link",
      error: error.message
    });
  }
};

// Get share link details
const getShareLink = async (req, res) => {
  try {
    const { token } = req.params;
    const { password = null } = req.body;

    const shareLink = await ShareLink.findOne({ token, isActive: true })
      .populate('fileId', 'originalname size mimetype')
      .populate('folderId', 'name')
      .populate('createdBy', 'username');

    if (!shareLink) {
      return res.status(404).json({
        message: "Share link not found or expired"
      });
    }

    // Check if expired
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      shareLink.isActive = false;
      await shareLink.save();
      return res.status(403).json({
        message: "Share link has expired"
      });
    }

    // Check max downloads
    if (shareLink.maxDownloads && shareLink.downloadCount >= shareLink.maxDownloads) {
      shareLink.isActive = false;
      await shareLink.save();
      return res.status(403).json({
        message: "Share link download limit exceeded"
      });
    }

    // Verify password if protected
    if (shareLink.password) {
      if (!password) {
        return res.status(403).json({
          message: "This share is password protected"
        });
      }

      const isPasswordValid = await bcryptjs.compare(password, shareLink.password);
      if (!isPasswordValid) {
        return res.status(403).json({
          message: "Invalid password"
        });
      }
    }

    res.status(200).json({
      message: "Share link details fetched",
      shareLink: {
        _id: shareLink._id,
        file: shareLink.fileId,
        folder: shareLink.folderId,
        sharedBy: shareLink.createdBy.username,
        accessType: shareLink.accessType,
        shareType: shareLink.shareType,
        expiresAt: shareLink.expiresAt,
        downloadCount: shareLink.downloadCount,
        maxDownloads: shareLink.maxDownloads,
        isProtected: !!shareLink.password
      }
    });
  } catch (error) {
    console.error("Share link fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch share link",
      error: error.message
    });
  }
};

// Download shared file
const downloadSharedFile = async (req, res) => {
  try {
    const { token } = req.params;
    const { password = null } = req.body;

    const shareLink = await ShareLink.findOne({ token, isActive: true })
      .populate('fileId');

    if (!shareLink) {
      return res.status(404).json({
        message: "Share link not found"
      });
    }

    // Check access type
    if (!['download', 'view'].includes(shareLink.accessType)) {
      return res.status(403).json({
        message: "Download not allowed for this share"
      });
    }

    // Check expiry
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      shareLink.isActive = false;
      await shareLink.save();
      return res.status(403).json({
        message: "Share link has expired"
      });
    }

    // Check max downloads
    if (shareLink.maxDownloads && shareLink.downloadCount >= shareLink.maxDownloads) {
      shareLink.isActive = false;
      await shareLink.save();
      return res.status(403).json({
        message: "Download limit exceeded"
      });
    }

    // Verify password
    if (shareLink.password) {
      if (!password) {
        return res.status(403).json({
          message: "Password required"
        });
      }
      const isPasswordValid = await bcryptjs.compare(password, shareLink.password);
      if (!isPasswordValid) {
        return res.status(403).json({
          message: "Invalid password"
        });
      }
    }

    const file = shareLink.fileId;

    // Check if file exists in storage
    const filePath = path.join(__dirname, "..", file.path);
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        message: "File not found in storage"
      });
    }

    // Increment download count
    shareLink.downloadCount += 1;
    await shareLink.save();

    await logActivity(shareLink.createdBy, "share_download", "file", file._id, file.originalname, "Shared file downloaded", "success");

    res.download(filePath, file.originalname);
  } catch (error) {
    console.error("Share download error:", error);
    res.status(500).json({
      message: "Failed to download file",
      error: error.message
    });
  }
};

// Share file with specific users
const shareWithUsers = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userIds, accessType = 'view' } = req.body;

    if (!fileId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: "fileId and userIds array are required"
      });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        message: "File not found"
      });
    }

    // Verify ownership
    if (file.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized"
      });
    }

    // Find or create private share link
    let shareLink = await ShareLink.findOne({
      fileId: fileId,
      createdBy: req.user.id,
      shareType: 'private',
      isActive: true
    });

    if (!shareLink) {
      const token = generateShareToken();
      shareLink = new ShareLink({
        fileId: fileId,
        createdBy: req.user.id,
        token,
        shareType: 'private',
        accessType
      });
    }

    // Add users to shared list
    const results = [];
    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          results.push({ userId, success: false, message: "User not found" });
          continue;
        }

        // Check if already shared
        const alreadyShared = shareLink.sharedWith.some(s => s.userId.toString() === userId);
        if (alreadyShared) {
          results.push({ userId, success: false, message: "Already shared with this user" });
          continue;
        }

        shareLink.sharedWith.push({
          userId,
          access: accessType
        });

        results.push({ userId, success: true, message: "Shared successfully" });
      } catch (err) {
        results.push({ userId, success: false, message: err.message });
      }
    }

    await shareLink.save();

    await logActivity(req.user.id, "share_with_users", "file", fileId, file.originalname, `Shared with ${userIds.length} users`, "success");

    res.status(200).json({
      message: "File sharing completed",
      results
    });
  } catch (error) {
    console.error("Share with users error:", error);
    res.status(500).json({
      message: "Failed to share file",
      error: error.message
    });
  }
};

// Update share link permissions
const updateShareLink = async (req, res) => {
  try {
    const { shareLinkId } = req.params;
    const { accessType, expiresAt, maxDownloads, isActive } = req.body;

    const shareLink = await ShareLink.findById(shareLinkId);

    if (!shareLink) {
      return res.status(404).json({
        message: "Share link not found"
      });
    }

    // Verify ownership
    if (shareLink.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized"
      });
    }

    if (accessType) shareLink.accessType = accessType;
    if (expiresAt !== undefined) shareLink.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (maxDownloads !== undefined) shareLink.maxDownloads = maxDownloads;
    if (isActive !== undefined) shareLink.isActive = isActive;

    shareLink.updatedAt = new Date();
    await shareLink.save();

    await logActivity(req.user.id, "share_update", "file", shareLink.fileId, null, "Share link updated", "success");

    res.status(200).json({
      message: "Share link updated successfully",
      shareLink
    });
  } catch (error) {
    console.error("Share update error:", error);
    res.status(500).json({
      message: "Failed to update share link",
      error: error.message
    });
  }
};

// Get user's share links
const getUserShareLinks = async (req, res) => {
  try {
    const shareLinks = await ShareLink.find({ createdBy: req.user.id, isActive: true })
      .populate('fileId', 'originalname size')
      .populate('folderId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Share links fetched",
      shareLinks: shareLinks.map(link => ({
        _id: link._id,
        fileId: link.fileId,
        folderId: link.folderId,
        token: link.token,
        shareType: link.shareType,
        accessType: link.accessType,
        expiresAt: link.expiresAt,
        downloadCount: link.downloadCount,
        maxDownloads: link.maxDownloads,
        shareUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/share/${link.token}`,
        createdAt: link.createdAt,
        sharedWithCount: link.sharedWith.length
      }))
    });
  } catch (error) {
    console.error("Get share links error:", error);
    res.status(500).json({
      message: "Failed to fetch share links",
      error: error.message
    });
  }
};

// Delete share link
const deleteShareLink = async (req, res) => {
  try {
    const { shareLinkId } = req.params;

    const shareLink = await ShareLink.findById(shareLinkId);

    if (!shareLink) {
      return res.status(404).json({
        message: "Share link not found"
      });
    }

    // Verify ownership
    if (shareLink.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized"
      });
    }

    shareLink.isActive = false;
    await shareLink.save();

    await logActivity(req.user.id, "share_delete", "file", shareLink.fileId, null, "Share link deleted", "success");

    res.status(200).json({
      message: "Share link deleted successfully"
    });
  } catch (error) {
    console.error("Share delete error:", error);
    res.status(500).json({
      message: "Failed to delete share link",
      error: error.message
    });
  }
};

module.exports = {
  createShareLink,
  getShareLink,
  downloadSharedFile,
  shareWithUsers,
  updateShareLink,
  getUserShareLinks,
  deleteShareLink
};
