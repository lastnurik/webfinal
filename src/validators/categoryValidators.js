const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required(),
  description: Joi.string().max(200).allow('', null),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).trim(),
  description: Joi.string().max(200).allow('', null),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
