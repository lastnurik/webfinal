const Joi = require('joi');

const basePostFields = {
  title: Joi.string().min(3).max(200),
  content: Joi.string().min(10),
  categoryId: Joi.string().hex().length(24).allow(null, ''),
  categoryName: Joi.string().min(2).max(50).trim().allow('', null),
  tags: Joi.array().items(Joi.string().max(30)),
  status: Joi.string().valid('draft', 'published'),
};

const createPostSchema = Joi.object({
  ...basePostFields,
  title: basePostFields.title.required(),
  content: basePostFields.content.required(),
});

const updatePostSchema = Joi.object(basePostFields);

module.exports = {
  createPostSchema,
  updatePostSchema,
};

