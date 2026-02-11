const API_BASE = '/api';

function getToken() {
  return window.localStorage.getItem('token');
}

function setToken(token) {
  window.localStorage.setItem('token', token);
}

function clearToken() {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
}

function setUser(user) {
  window.localStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.message || 'Request failed';
    throw new Error(message);
  }
  return data;
}

function toggleNavAuth() {
  const token = getToken();
  document.querySelectorAll('.when-logged-in').forEach((el) => {
    el.style.display = token ? '' : 'none';
  });
  document.querySelectorAll('.when-logged-out').forEach((el) => {
    el.style.display = token ? 'none' : '';
  });
}

function getPostIdFromPath() {
  const m = window.location.pathname.match(/\/posts\/([a-f0-9]+)/i);
  return m ? m[1] : null;
}

async function loadHomePosts() {
  const container = document.getElementById('home-posts');
  if (!container) return;
  try {
    const posts = await apiRequest('/posts/public');
    if (!posts.length) {
      container.innerHTML = '<div class="col-12 text-muted">No published posts yet.</div>';
      return;
    }
    container.innerHTML = posts
      .map(
        (p) => `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            ${p.category ? `<span class="badge bg-primary mb-2">${escapeHtml(p.category.name)}</span>` : ''}
            <h5 class="card-title"><a href="/posts/${p._id}" class="text-decoration-none text-dark">${escapeHtml(p.title)}</a></h5>
            <p class="card-text text-muted small">${escapeHtml((p.content || '').slice(0, 120))}${p.content && p.content.length > 120 ? '…' : ''}</p>
            <p class="small text-muted mb-0">by ${escapeHtml((p.author && p.author.username) || 'Unknown')} · ${p.commentCount || 0} comments</p>
            <a href="/posts/${p._id}" class="stretched-link"></a>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    container.innerHTML = `<div class="col-12 text-danger">${escapeHtml(err.message)}</div>`;
  }
}

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function loadPostDetail() {
  const postId = getPostIdFromPath();
  if (!postId) return;
  const articleEl = document.getElementById('post-article');
  const commentsSection = document.getElementById('comments-section');
  const commentsList = document.getElementById('comments-list');
  const commentFormWrap = document.getElementById('comment-form-wrap');
  const commentsLoginHint = document.getElementById('comments-login-hint');
  const commentForm = document.getElementById('comment-form');
  const commentPostId = document.getElementById('comment-post-id');
  const commentContent = document.getElementById('comment-content');

  try {
    const post = await apiRequest(`/posts/${postId}`);
    articleEl.innerHTML = `
      <header class="mb-3">
        <h1 class="h3">${escapeHtml(post.title)}</h1>
        <p class="post-meta mb-1">
          by <span class="fw-semibold">${escapeHtml((post.author && post.author.username) || 'Unknown')}</span>
          ${post.category ? ` in <span class="badge bg-secondary">${escapeHtml(post.category.name)}</span>` : ''}
        </p>
        <p class="post-meta small">${post.publishedAt ? new Date(post.publishedAt).toLocaleString() : new Date(post.createdAt).toLocaleString()}</p>
      </header>
      <div class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
    `;
    commentsSection.style.display = 'block';

    const comments = post.comments || [];
    const user = getUser();
    commentsList.innerHTML = comments
      .map(
        (c) => {
          const canModify = user && (String(c.author._id) === String(user._id) || user.role === 'admin');
          return `
        <div class="card mb-2" data-comment-id="${c._id}">
          <div class="card-body py-2">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="comment-author">${escapeHtml((c.author && c.author.username) || 'Unknown')}</span>
                <span class="text-muted small ms-2">${new Date(c.createdAt).toLocaleString()}</span>
              </div>
              ${canModify ? `<div><button type="button" class="btn btn-link btn-sm p-0 me-1 comment-edit" data-id="${c._id}">Edit</button><button type="button" class="btn btn-link btn-sm p-0 text-danger comment-delete" data-id="${c._id}">Delete</button></div>` : ''}
            </div>
            <p class="mb-0 mt-1 comment-content">${escapeHtml(c.content)}</p>
          </div>
        </div>
      `;
        }
      )
      .join('');

    if (getToken()) {
      commentFormWrap.style.display = 'block';
      commentsLoginHint.style.display = 'none';
      commentPostId.value = postId;
      commentForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
          await apiRequest(`/comments/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content: commentContent.value.trim() }),
          });
          commentContent.value = '';
          loadPostDetail();
        } catch (err) {
          alert(err.message);
        }
      };
    } else {
      commentFormWrap.style.display = 'none';
      commentsLoginHint.style.display = 'block';
    }

    commentsList.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.comment-edit');
      const delBtn = e.target.closest('.comment-delete');
      if (editBtn) {
        const id = editBtn.dataset.id;
        const card = editBtn.closest('.card');
        const contentEl = card?.querySelector('.comment-content');
        const content = contentEl ? contentEl.textContent : '';
        const newContent = prompt('Edit comment:', content);
        if (newContent === null) return;
        try {
          await apiRequest(`/comments/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ content: newContent.trim() }),
          });
          loadPostDetail();
        } catch (err) {
          alert(err.message);
        }
      }
      if (delBtn) {
        if (!confirm('Delete this comment?')) return;
        try {
          await apiRequest(`/comments/${delBtn.dataset.id}`, { method: 'DELETE' });
          loadPostDetail();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  } catch (err) {
    articleEl.innerHTML = `<div class="text-danger">${escapeHtml(err.message)}</div>`;
  }
}

async function loadDashboard() {
  const profileEl = document.getElementById('profile-summary');
  const postsBody = document.getElementById('posts-table-body');
  const categoriesList = document.getElementById('categories-list');

  if (profileEl) {
    try {
      const profile = await apiRequest('/users/profile');
      setUser(profile);
      profileEl.textContent = `Logged in as ${escapeHtml(profile.username)} (${escapeHtml(profile.email)}) · ${profile.role}`;
    } catch (err) {
      profileEl.textContent = 'Please log in.';
      if (postsBody) postsBody.innerHTML = '<tr><td colspan="5" class="text-muted">Log in to see your posts.</td></tr>';
      return;
    }
  }

  if (postsBody) {
    try {
      const posts = await apiRequest('/posts');
      if (!posts.length) {
        postsBody.innerHTML = '<tr><td colspan="5" class="text-muted">No posts yet. Create one!</td></tr>';
      } else {
        postsBody.innerHTML = posts
          .map(
            (p) => `
          <tr>
            <td><a href="/posts/${p._id}" class="text-decoration-none">${escapeHtml(p.title)}</a></td>
            <td>${p.category ? escapeHtml(p.category.name) : '—'}</td>
            <td><span class="badge ${p.status === 'published' ? 'bg-success' : 'bg-secondary'}">${p.status}</span></td>
            <td>${new Date(p.createdAt).toLocaleDateString()}</td>
            <td>
              <a href="/posts/${p._id}" class="btn btn-sm btn-outline-primary me-1">View</a>
              <button type="button" class="btn btn-sm btn-outline-secondary me-1 btn-edit-post" data-id="${p._id}">Edit</button>
              <button type="button" class="btn btn-sm btn-outline-danger btn-delete-post" data-id="${p._id}" data-title="${escapeHtml(p.title).replace(/"/g, '&quot;')}">Delete</button>
            </td>
          </tr>
        `
          )
          .join('');
      }
    } catch (err) {
      postsBody.innerHTML = `<tr><td colspan="5" class="text-danger">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  if (categoriesList) {
    try {
      const categories = await apiRequest('/categories');
      categoriesList.innerHTML = categories
        .map(
          (c) => `
        <span class="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
          ${escapeHtml(c.name)}
          <button type="button" class="btn btn-link btn-sm p-0 text-danger border-0 btn-delete-category" data-id="${c._id}" data-name="${escapeHtml(c.name).replace(/"/g, '&quot;')}" title="Delete if no posts">×</button>
        </span>
      `
        )
        .join('');

      categoriesList.querySelectorAll('.btn-delete-category').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Delete category "${btn.dataset.name}"? (Only possible if it has no posts.)`)) return;
          try {
            await apiRequest(`/categories/${btn.dataset.id}`, { method: 'DELETE' });
            loadDashboard();
          } catch (err) {
            alert(err.message);
          }
        });
      });
    } catch (err) {
      categoriesList.innerHTML = `<span class="text-muted">${escapeHtml(err.message)}</span>`;
    }
  }

  const postModal = document.getElementById('postModal');
  const postForm = document.getElementById('post-form');
  const postModalTitle = document.getElementById('postModalTitle');
  const postId = document.getElementById('post-id');
  const postTitle = document.getElementById('post-title');
  const postContent = document.getElementById('post-content');
  const postCategoryId = document.getElementById('post-category-id');
  const postCategoryName = document.getElementById('post-category-name');
  const postTags = document.getElementById('post-tags');
  const postStatus = document.getElementById('post-status');

  async function fillCategorySelect() {
    const cats = await apiRequest('/categories');
    postCategoryId.innerHTML = '<option value="">— None —</option>' + cats.map((c) => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join('');
  }

  document.getElementById('btn-new-post')?.addEventListener('click', async () => {
    postId.value = '';
    postForm.reset();
    postModalTitle.textContent = 'New Post';
    await fillCategorySelect();
    postCategoryName.value = '';
    new bootstrap.Modal(postModal).show();
  });

  const postsTableBody = document.getElementById('posts-table-body');
  if (postsTableBody) {
    postsTableBody.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.btn-edit-post');
      const delBtn = e.target.closest('.btn-delete-post');
  if (editBtn) {
        const id = editBtn.dataset.id;
        try {
          const post = await apiRequest(`/posts/${id}`);
          await fillCategorySelect();
          postId.value = post._id;
          postTitle.value = post.title;
          postContent.value = post.content;
          postCategoryId.value = post.category ? post.category._id : '';
          postCategoryName.value = '';
          postTags.value = (post.tags || []).join(', ');
          postStatus.value = post.status || 'draft';
          postModalTitle.textContent = 'Edit Post';
          new bootstrap.Modal(postModal).show();
        } catch (err) {
          alert(err.message);
        }
      }
      if (delBtn) {
        window._deletePostId = delBtn.dataset.id;
        window._deletePostTitle = delBtn.dataset.title;
        new bootstrap.Modal(document.getElementById('deletePostModal')).show();
      }
    });
  }

  document.getElementById('btn-confirm-delete-post')?.addEventListener('click', async () => {
    const id = window._deletePostId;
    if (!id) return;
    try {
      await apiRequest(`/posts/${id}`, { method: 'DELETE' });
      bootstrap.Modal.getInstance(document.getElementById('deletePostModal')).hide();
      loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  });

  postForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = postId.value;
    const payload = {
      title: postTitle.value.trim(),
      content: postContent.value.trim(),
      tags: postTags.value ? postTags.value.split(',').map((t) => t.trim()).filter(Boolean) : [],
      status: postStatus.value,
    };
    if (postCategoryId.value) payload.categoryId = postCategoryId.value;
    if (postCategoryName.value.trim()) payload.categoryName = postCategoryName.value.trim();
    try {
      if (id) {
        await apiRequest(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/posts', { method: 'POST', body: JSON.stringify(payload) });
      }
      bootstrap.Modal.getInstance(postModal).hide();
      loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('btn-add-category')?.addEventListener('click', async () => {
    const nameInput = document.getElementById('new-category-name');
    const name = nameInput?.value?.trim();
    if (!name) return;
    try {
      await apiRequest('/categories', { method: 'POST', body: JSON.stringify({ name }) });
      nameInput.value = '';
      loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById('username')?.value?.trim();
  const email = document.getElementById('email')?.value?.trim();
  const password = document.getElementById('password')?.value;

  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    window.location.href = '/dashboard';
  } catch (err) {
    alert(err.message);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email')?.value?.trim();
  const password = document.getElementById('password')?.value;

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    window.location.href = '/dashboard';
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  toggleNavAuth();

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    clearToken();
    toggleNavAuth();
    window.location.href = '/';
  });

  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  if (document.getElementById('home-posts')) loadHomePosts();
  if (getPostIdFromPath()) loadPostDetail();
  if (document.getElementById('posts-table-body')) loadDashboard();
});
