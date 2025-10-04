import logger from '#config/logger.js';
import { jwtToken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const authenticateToken = (req, res, next) => {
  try {
    const token = cookies.get(req, 'token');

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authentication token provided',
      });
    }

    const decoded = jwtToken.verify(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = roles => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};
