const jwt = require('jsonwebtoken');

/**
 * Middleware to verify if a request is coming from a logged-in user.
 * It checks the 'token' in request cookies or the standard 'Authorization' header.
 */
const authenticateToken = (req, res, next) => {
  // 1. Retrieve the token from either cookies or the authorization header
  const tokenFromCookie = req.cookies ? req.cookies.token : null;
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1]; // Format is "Bearer TOKEN"

  const token = tokenFromCookie || tokenFromHeader;

  // 2. If no token is provided, deny access immediately
  if (!token) {
    return res.status(401).json({ 
      error: "Access Denied. You must log in to access this resource." 
    });
  }

  try {
    // 3. Verify the token using the secret key defined in our .env file
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campushive_super_secret_security_key_2026_xyz');
    
    // 4. Attach the decoded user data (ID, email, etc.) to the request object
    // This allows subsequent routes to know exactly who is making the API request
    req.user = decoded;
    
    // 5. Proceed to the actual API route function
    next();
  } catch (error) {
    // If verification fails (e.g. token expired, modified, or invalid)
    return res.status(403).json({ 
      error: "Invalid or expired token. Please log in again." 
    });
  }
};

module.exports = authenticateToken;
