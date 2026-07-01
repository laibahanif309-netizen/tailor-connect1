const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }
  if (!process.env.JWT_SECRET) {
    return sendError(res, 'JWT_SECRET is not configured', 500);
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
    return next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden', 403);
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
