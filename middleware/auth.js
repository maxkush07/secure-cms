const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and validates user roles
 */

/**
 * Middleware to verify JWT token from request headers
 * Expects token in Authorization header: "Bearer <token>"
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user has required roles
 * @param {string|string[]} requiredRoles - Role or array of roles required to access the resource
 */
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const roles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];

      const userRole = req.user.role;

      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          requiredRoles: roles,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Role verification failed',
        error: error.message
      });
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 * @param {string|string[]} requiredPermissions - Permission or array of permissions
 */
const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      const userPermissions = req.user.permissions || [];

      const hasPermission = permissions.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          requiredPermissions: permissions
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Permission verification failed',
        error: error.message
      });
    }
  };
};

/**
 * Utility function to generate JWT token
 * @param {object} payload - Data to encode in token
 * @param {string} expiresIn - Token expiration time (default: '24h')
 */
const generateToken = (payload, expiresIn = '24h') => {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn
    });
    return token;
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

/**
 * Utility function to decode and validate token
 * @param {string} token - JWT token to decode
 */
const decodeToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  verifyToken,
  checkRole,
  checkPermission,
  generateToken,
  decodeToken
};
