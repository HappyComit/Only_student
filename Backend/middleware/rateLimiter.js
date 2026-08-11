const rateLimit = require('express-rate-limit');

/**
 * Auth Rate Limiter — Per-User Account Protection
 * 
 * Limits: 10 requests per 5 minutes PER USER (by email or userId).
 * 
 * Why per-user instead of per-IP?
 * On university campus Wi-Fi (e.g. CU), many students share the same public IP.
 * IP-based limiting would unfairly block legitimate users when one person
 * triggers the limit. By keying on the user's email (from req.body for login/OTP)
 * or userId (from JWT for authenticated routes), each student gets their own
 * independent rate limit bucket.
 * 
 * Applied to: POST /login, POST /forgot-password (OTP generation)
 */
const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,                  // 10 requests per window per user
  standardHeaders: true,    // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,     // Disable `X-RateLimit-*` headers

  // Key by user email/account rather than IP address
  keyGenerator: (req) => {
    // For login & forgot-password, the email is in req.body
    if (req.body && req.body.email) {
      return `email:${req.body.email.trim().toLowerCase()}`;
    }
    // For authenticated routes, use the JWT userId
    if (req.user && req.user.userId) {
      return `user:${req.user.userId}`;
    }
    // Fallback to IP only if no user identifier is available
    return req.ip;
  },

  // Custom JSON response when rate limit is exceeded
  handler: (req, res) => {
    return res.status(429).json({
      error: "Too many attempts for this account. Please wait 5 minutes before trying again.",
      retryAfterMs: 5 * 60 * 1000,
    });
  },
});

module.exports = { authRateLimiter };
