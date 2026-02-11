const Joi = require('joi');

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).trim().required(),
});

const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).trim().required(),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
};
