const Joi = require('joi');

const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  email: Joi.string().email(),
  password: Joi.string().min(6).max(128),
  currentPassword: Joi.string().min(6).max(128),
}).with('password', 'currentPassword');

module.exports = {
  updateProfileSchema,
};

