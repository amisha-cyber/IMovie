import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';
import { ROLES } from '../utils/constants.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    let isCookieAuth = false;

    // 1. Check Authorization header (Primary auth mechanism)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Fallback to cookie (Only when header is absent)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      isCookieAuth = true;
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. Please log in.', 401);
    }

    // CSRF protection for cookie-based authentication on state-mutating HTTP methods
    if (isCookieAuth) {
      const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
      if (isMutatingMethod) {
        const hasCsrfHeader = Boolean(req.headers['x-requested-with'] || req.headers['x-imovies-client']);
        if (!hasCsrfHeader) {
          return errorResponse(
            res,
            'CSRF protection check failed for cookie authentication. Expected custom header (X-Requested-With or X-IMovies-Client).',
            403
          );
        }
      }
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.id) {
      return errorResponse(res, 'Session expired or invalid token. Please log in again.', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 'User associated with token no longer exists.', 401);
    }

    // Session validation via tokenVersion (Missing claim defaults to 0)
    const tokenVersion = decoded.tokenVersion !== undefined ? Number(decoded.tokenVersion) : 0;
    const userTokenVersion = user.tokenVersion !== undefined ? Number(user.tokenVersion) : 0;
    if (tokenVersion !== userTokenVersion) {
      return errorResponse(res, 'Session expired or invalidated. Please log in again.', 401);
    }

    // Reject non-active, suspended, or deleted users on EVERY request
    if (user.accountStatus !== 'active') {
      return errorResponse(res, 'User account is not active, suspended, or deleted.', 401);
    }

    if (!user.isEmailVerified) {
      return errorResponse(
        res,
        'Email verification required. Please verify your email before accessing this service.',
        403,
        null,
        'EMAIL_NOT_VERIFIED'
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication error.', 401, error.message);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Access denied. You do not have permission to perform this action.', 403);
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id);
        if (user && user.accountStatus === 'active') {
          const tokenVersion = decoded.tokenVersion !== undefined ? Number(decoded.tokenVersion) : 0;
          const userTokenVersion = user.tokenVersion !== undefined ? Number(user.tokenVersion) : 0;
          if (tokenVersion === userTokenVersion) {
            req.user = user;
          }
        }
      }
    }
  } catch (err) {
    // Ignore error for optional authentication
  }
  next();
};

export const requireAdmin = authorize(ROLES.ADMIN);
