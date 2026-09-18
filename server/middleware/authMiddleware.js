import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'g13_super_secret_jwt_access_key_2026_x9k2p';

/**
 * Strict authentication middleware: Requires a valid Bearer access token.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Missing Bearer token in Authorization header.'
      }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Malformed or invalid authentication token.'
        }
      });
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found or deactivated.'
        }
      });
    }

    // Attach safe user object to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      avatar: user.avatar
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh session.'
        }
      });
    }
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token.'
      }
    });
  }
}

/**
 * Optional authentication: Attaches user if valid token present, otherwise proceeds as guest.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id) {
        const user = await userRepository.findById(decoded.id);
        if (user && user.is_active) {
          req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            avatar: user.avatar
          };
        }
      }
    } catch {
      // Ignore token errors for optional auth
    }
  }
  next();
}

export default { requireAuth, optionalAuth };
