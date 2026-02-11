const express = require('express');

const {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createCommentSchema,
  updateCommentSchema,
} = require('../validators/commentValidators');

const router = express.Router();

router.get('/posts/:postId/comments', getCommentsByPost);
router.post('/posts/:postId/comments', protect, validate(createCommentSchema), createComment);
router.put('/:id', protect, validate(updateCommentSchema), updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
