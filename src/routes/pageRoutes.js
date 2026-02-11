const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', { title: 'Blog Platform', user: null });
});

router.get('/auth/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

router.get('/auth/register', (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

router.get('/dashboard', (req, res) => {
  res.render('dashboard/index', { title: 'Dashboard' });
});

router.get('/admin', (req, res) => {
  res.render('dashboard/admin', { title: 'Admin Panel' });
});

router.get('/posts/:id', (req, res) => {
  res.render('posts/show', { title: 'Post Details' });
});

module.exports = router;

