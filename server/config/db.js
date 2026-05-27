const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/fileserver";

    console.log("🔄 Connecting to MongoDB:", mongoURI);

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log("✅ MongoDB Connected Successfully");

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on('reconnected', () => {
      console.log("✅ MongoDB reconnected successfully");
    });

    mongoose.connection.on('error', (error) => {
      console.error("❌ MongoDB connection error:", error.message);
    });

  } catch (error) {
    console.error("❌ MongoDB Connection Failed:");
    console.error("   Error:", error.message);
    console.error("   Connection URI:", process.env.MONGO_URI || "mongodb://localhost:27017/fileserver");
    console.error("\n📋 TROUBLESHOOTING:");
    console.error("   1. Make sure MongoDB is running:");
    console.error("      - Windows: net start MongoDB");
    console.error("      - Linux: sudo systemctl start mongod");
    console.error("      - macOS: brew services start mongodb-community");
    console.error("\n   2. Check .env file has correct MONGO_URI");
    console.error("   3. Verify connection string format:");
    console.error("      - Local: mongodb://localhost:27017/fileserver");
    console.error("      - Remote: mongodb+srv://user:pass@cluster.mongodb.net/fileserver");
    console.error("\n   4. Verify firewall/network access if using remote MongoDB\n");

    // Don't exit immediately - retry connection
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;