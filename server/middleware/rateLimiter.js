// Rate limiting middleware
const rateLimit = require('express-rate-limit');

// Track failed login attempts in memory (use Redis in production)
const loginAttempts = new Map();

// Rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req, res) => {
    return false;
  }
});

// Rate limiter for registration endpoint
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 registrations per hour
  message: 'Too many registrations from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for password reset endpoint
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 password reset attempts per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  apiLimiter
};
