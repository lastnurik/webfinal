const express = require('express');

const {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createCategorySchema,
  updateCategorySchema,
} = require('../validators/categoryValidators');

const router = express.Router();

router.get('/', listCategories);
router.get('/:id', getCategoryById);
router.post('/', protect, validate(createCategorySchema), createCategory);
router.put('/:id', protect, validate(updateCategorySchema), updateCategory);
router.delete('/:id', protect, deleteCategory);

module.exports = router;
