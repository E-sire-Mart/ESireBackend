// middleware/auth.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const authenticate = (req, res, next) => {
  const authTokenHeader = req?.headers?.authorization;

  if (!authTokenHeader) {
    console.error("Unauthorized - Missing Authorization Header");
    
    return res
      .status(401)
      .json({ message: "Unauthorized - Missing Authorization Header" });
  }

  const [bearer, authToken] = authTokenHeader.split(" ");

  if (bearer !== "Bearer" || !authToken) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid Authorization Header Format" });
  }

  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    req.user = decoded;

    // Debug: Log the decoded token structure
    console.log("Decoded JWT token:", JSON.stringify(decoded, null, 2));
    console.log("User ID from token:", decoded.userId);
    console.log("Request URL:", req.originalUrl);
    console.log("Request method:", req.method);
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    console.error("Token that failed:", authToken);
    return res.status(401).json({ message: "Unauthorized - Invalid Token" });
  }
};

// Optional auth middleware for GET endpoints where auth is not strictly required
const authenticateOptional = (req, res, next) => {
  const authTokenHeader = req?.headers?.authorization;
  if (!authTokenHeader) {
    return next();
  }
  const [bearer, authToken] = authTokenHeader.split(" ");
  if (bearer !== "Bearer" || !authToken) {
    return next();
  }
  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    req.user = decoded;
  } catch (_e) {
    // ignore invalid token in optional mode
  }
  next();
};

module.exports = { authenticate, authenticateOptional };
