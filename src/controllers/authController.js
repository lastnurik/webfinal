const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateAccessToken } = require('../config/jwt');

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400);
      throw new Error('User with this email or username already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      username,
      email,
      passwordHash,
      role: 'user',
    });

    const token = generateAccessToken(user);

    res.status(201).json({
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateAccessToken(user);

    res.json({
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
};

