const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, token missing'));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500);
    return next(new Error('JWT_SECRET is not configured'));
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    res.status(401);
    return next(new Error('Not authorized, token invalid or expired'));
  }
}

function optionalProtect(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    req.user = null;
    return next();
  }
}

module.exports = {
  protect,
  optionalProtect,
};

