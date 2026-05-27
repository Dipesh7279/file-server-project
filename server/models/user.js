const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  username: {
    required: true,
    type: String,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },

  email: {
    required: true,
    type: String,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  password: {
    required: true,
    type: String,
    minlength: 8
  },

  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },

  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  emailVerificationToken: {
    type: String,
    default: null
  },

  emailVerificationExpires: {
    type: Date,
    default: null
  },

  // Password reset
  passwordResetToken: {
    type: String,
    default: null
  },

  passwordResetExpires: {
    type: Date,
    default: null
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },

  // Storage management
  storageQuota: {
    type: Number,
    default: function() {
      // Admin: 1GB (1073741824 bytes), User: 100MB (104857600 bytes)
      return this.role === 'admin' ? 1073741824 : 104857600;
    }
  },

  storageUsed: {
    type: Number,
    default: 0
  },

  // Authentication
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }],

  lastLogin: {
    type: Date,
    default: null
  },

  // Rate limiting & security
  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: {
    type: Date,
    default: null
  },

  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  twoFactorSecret: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Index for frequently queried fields
// Note: email and username already have indexes via unique: true
userSchema.index({ emailVerificationToken: 1 })
userSchema.index({ passwordResetToken: 1 })

module.exports = mongoose.model("User", userSchema)