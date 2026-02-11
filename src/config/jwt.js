const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

module.exports = {
  generateAccessToken,
};

