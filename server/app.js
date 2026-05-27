const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");
const authroutes = require("./routes/authroutes");
const authmiddleware = require("./middleware/authMiddleware");
const fileroutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");
const shareRoutes = require("./routes/shareRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { apiLimiter } = require("./middleware/rateLimiter");

dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect DB
connectDB();

const app = express();

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// Core middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Test route
app.get("/", (req, res) => {
  res.send("File server is running");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Protected route test
app.get("/api/protected", authmiddleware, (req, res) => {
  res.json({
    message: "protected route accessed",
    user: req.user
  });
});

// Routes
app.use("/api/auth", authroutes);
app.use("/api/files", fileroutes);
app.use("/api/folders", folderRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: "File too large. Maximum size is 100 MB." });
  }

  if (err.message === 'File type not allowed') {
    return res.status(400).json({ message: "File type not allowed." });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: "Token expired" });
  }

  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ?
      "Internal server error" :
      err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});