const bcrypt = require('bcrypt');
const User = require('../models/User');

async function getProfile(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json(user.toJSON());
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const { username, email, password, currentPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (username) {
      user.username = username;
    }

    if (email) {
      user.email = email;
    }

    if (password) {
      const matches = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!matches) {
        res.status(400);
        throw new Error('Current password is incorrect');
      }

      const saltRounds = 10;
      user.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    await user.save();

    res.json(user.toJSON());
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
};

