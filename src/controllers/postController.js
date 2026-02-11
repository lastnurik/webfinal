const Post = require('../models/Post');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const { slugify } = require('../utils/slugify');

/** Get author id whether author is ObjectId or populated object */
function getAuthorId(post) {
  if (!post || !post.author) return null;
  const a = post.author;
  return (a._id != null ? a._id : a).toString();
}

function ensureCanAccessPost(user, post) {
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }
  const authorId = getAuthorId(post);
  const isAuthor = authorId && authorId === user.id;
  const isAdmin = user.role === 'admin';
  if (!isAuthor && !isAdmin) {
    const err = new Error('Forbidden: you can only access your own posts');
    err.statusCode = 403;
    throw err;
  }
}

async function resolveCategory(categoryId, categoryName) {
  if (categoryId) {
    const cat = await Category.findById(categoryId);
    return cat ? cat._id : null;
  }
  if (categoryName && categoryName.trim()) {
    const name = categoryName.trim();
    const slug = slugify(name);
    let cat = await Category.findOne({ $or: [{ name }, { slug }] });
    if (!cat) {
      cat = await Category.create({ name, slug, description: '' });
    }
    return cat._id;
  }
  return null;
}

async function createPost(req, res, next) {
  try {
    const { title, content, categoryId, categoryName, tags, status } = req.body;
    const category = await resolveCategory(categoryId, categoryName);

    const post = await Post.create({
      title,
      content,
      author: req.user.id,
      category: category || undefined,
      tags: tags || [],
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null,
    });

    await post.populate([
      { path: 'author', select: 'username' },
      { path: 'category', select: 'name slug' },
    ]);
    res.status(201).json(post);
  } catch (err) {
    return next(err);
  }
}

async function getPosts(req, res, next) {
  try {
    const posts = await Post.find({ author: req.user.id })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    return next(err);
  }
}

async function getPublishedPosts(req, res, next) {
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('author', 'username')
      .populate('category', 'name slug')
      .sort({ publishedAt: -1 });
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: posts.map((p) => p._id) } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(commentCounts.map((c) => [c._id.toString(), c.count]));
    const result = posts.map((p) => ({
      ...p.toObject(),
      commentCount: countMap[p._id.toString()] || 0,
    }));
    res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function getPostById(req, res, next) {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username')
      .populate('category', 'name slug');
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Published posts: anyone can view (guest or logged in)
    if (post.status !== 'published') {
      if (!req.user) {
        res.status(404);
        throw new Error('Post not found');
      }
      ensureCanAccessPost(req.user, post);
    }

    const comments = await Comment.find({ post: post._id })
      .populate('author', 'username')
      .sort({ createdAt: 1 });
    const postObj = post.toObject();
    postObj.comments = comments;
    res.json(postObj);
  } catch (err) {
    if (err.statusCode) return next(err);
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Post not found'));
    }
    return next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    ensureCanAccessPost(req.user, post);

    const { title, content, categoryId, categoryName, tags, status } = req.body;

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (categoryId !== undefined || categoryName !== undefined) {
      post.category = categoryId === null && (categoryName === undefined || categoryName === '')
        ? null
        : await resolveCategory(categoryId, categoryName);
    }
    if (tags !== undefined) post.tags = tags;
    if (status !== undefined) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
      if (status === 'draft') {
        post.publishedAt = null;
      }
    }

    await post.save();
    await post.populate([
      { path: 'author', select: 'username' },
      { path: 'category', select: 'name slug' },
    ]);
    res.json(post);
  } catch (err) {
    if (err.statusCode) return next(err);
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Post not found'));
    }
    return next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    const authorId = getAuthorId(post);
    const isAuthor = authorId && authorId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      res.status(403);
      throw new Error('Forbidden: only the author or an admin can delete this post');
    }

    await post.deleteOne();
    res.status(204).send();
  } catch (err) {
    if (err.statusCode) return next(err);
    if (err.kind === 'ObjectId') {
      res.status(404);
      return next(new Error('Post not found'));
    }
    return next(err);
  }
}

module.exports = {
  createPost,
  getPosts,
  getPublishedPosts,
  getPostById,
  updatePost,
  deletePost,
};
