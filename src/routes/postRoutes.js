const express = require('express');

const {
  createPost,
  getPosts,
  getPublishedPosts,
  getPostById,
  updatePost,
  deletePost,
} = require('../controllers/postController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createPostSchema, updatePostSchema } = require('../validators/postValidators');

const router = express.Router();

router.get('/public', getPublishedPosts);
router.get('/public/:id', optionalProtect, getPostById);

router.post('/', protect, validate(createPostSchema), createPost);
router.get('/', protect, getPosts);
router.get('/:id', optionalProtect, getPostById);
router.put('/:id', protect, validate(updatePostSchema), updatePost);
router.delete('/:id', protect, deletePost);

module.exports = router;
