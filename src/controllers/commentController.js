const Comment = require('../models/Comment');
const Post = require('../models/Post');

function ensureCanModifyComment(user, comment) {
  if (!comment) {
    const err = new Error('Comment not found');
    err.statusCode = 404;
    throw err;
  }
  const isAuthor = comment.author.toString() === user.id;
  const isAdmin = user.role === 'admin';
  if (!isAuthor && !isAdmin) {
    const err = new Error('Forbidden: you can only modify your own comments');
    err.statusCode = 403;
    throw err;
  }
}

async function getCommentsByPost(req, res, next) {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    const comments = await Comment.find({ post: postId })
      .populate('author', 'username')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    if (err.statusCode) return next(err);
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Post not found'));
    }
    return next(err);
  }
}

async function createComment(req, res, next) {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    const comment = await Comment.create({
      post: postId,
      author: req.user.id,
      content: req.body.content.trim(),
    });
    await comment.populate('author', 'username');
    res.status(201).json(comment);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Post not found'));
    }
    return next(err);
  }
}

async function updateComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    ensureCanModifyComment(req.user, comment);
    comment.content = req.body.content.trim();
    await comment.save();
    await comment.populate('author', 'username');
    res.json(comment);
  } catch (err) {
    if (err.statusCode) return next(err);
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Comment not found'));
    }
    return next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    ensureCanModifyComment(req.user, comment);
    await comment.deleteOne();
    res.status(204).send();
  } catch (err) {
    if (err.statusCode) return next(err);
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Comment not found'));
    }
    return next(err);
  }
}

module.exports = {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
};
