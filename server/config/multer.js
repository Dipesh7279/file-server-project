const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Use absolute path for uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Block executable files
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (blockedExtensions.includes(ext)) {
    cb(new Error('File type not allowed'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB
  }
});

module.exports = upload;