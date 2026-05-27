const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authroutes = require("./routes/authroutes");
const authmiddleware = require("./middleware/authMiddleware");
const fileroutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");

dotenv.config();

// Connect DB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Test route
app.get("/", (req, res) => {
  res.send("File server is running");
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: "File too large. Maximum size is 100 MB." });
  }
  if (err.message === 'File type not allowed') {
    return res.status(400).json({ message: "File type not allowed." });
  }
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});