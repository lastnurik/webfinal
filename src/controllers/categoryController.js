const Category = require('../models/Category');
const Post = require('../models/Post');
const { slugify } = require('../utils/slugify');

async function listCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    return next(err);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    res.json(category);
  } catch (err) {
    if (err.statusCode) return next(err);
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Category not found'));
    }
    return next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    const slug = slugify(name);

    const existing = await Category.findOne({
      $or: [{ name: name.trim() }, { slug }],
    });
    if (existing) {
      res.status(400);
      throw new Error('Category with this name already exists');
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || '',
    });
    res.status(201).json(category);
  } catch (err) {
    return next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    const { name, description } = req.body;
    if (name !== undefined) {
      const slug = slugify(name);
      const existing = await Category.findOne({
        _id: { $ne: req.params.id },
        $or: [{ name: name.trim() }, { slug }],
      });
      if (existing) {
        res.status(400);
        throw new Error('Category with this name already exists');
      }
      category.name = name.trim();
      category.slug = slug;
    }
    if (description !== undefined) category.description = description;

    await category.save();
    res.json(category);
  } catch (err) {
    if (err.statusCode) return next(err);
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Category not found'));
    }
    return next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    const postCount = await Post.countDocuments({ category: category._id });
    if (postCount > 0) {
      res.status(400);
      throw new Error('Cannot delete category: it has posts. Remove or reassign posts first.');
    }

    await category.deleteOne();
    res.status(204).send();
  } catch (err) {
    if (err.statusCode) return next(err);
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Category not found'));
    }
    return next(err);
  }
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
