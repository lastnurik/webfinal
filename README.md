# Blog Platform Final Project

Node.js + Express.js blog platform with MongoDB, JWT authentication, role-based access control, and a Bootstrap front-end. This project is designed to satisfy the final project requirements (authentication, REST API, validation, RBAC, error handling, and documentation).

## Tech Stack & Architecture

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens) + bcrypt password hashing
- **Validation**: Joi
- **Views**: EJS templates + Bootstrap 5
- **Other**: Docker + Docker Compose for local deployment

Project structure:

- `src/server.js` – Server bootstrap and MongoDB connection
- `src/app.js` – Express configuration, middleware, and routes
- `src/config/db.js` – MongoDB connection
- `src/config/jwt.js` – JWT token generation helper
- `src/models/*.js` – Mongoose models (`User`, `Post`, `Comment`, `Category`, `Like`)
- `src/controllers/*.js` – Controllers for auth, users, posts, categories, comments
- `src/routes/*.js` – API and page routes
- `src/middleware/*.js` – Auth, RBAC, validation, and global error handler
- `src/validators/*.js` – Joi schemas for request validation
- `src/views/**/*.ejs` – EJS views for pages (home, auth, dashboard, post detail, admin)
- `public/**` – Static assets (CSS, JS)

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+ (or 20+ recommended)
- MongoDB running locally **or** a MongoDB Atlas connection string

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` as needed:

- `PORT` – API port (default `5000`)
- `MONGODB_URI` – MongoDB connection string (e.g., `mongodb://localhost:27017/webfinal`)
- `JWT_SECRET` – Secret key for JWT signing (use a strong random string)
- `JWT_EXPIRES_IN` – Token lifespan (e.g., `1h`)

### 3. Run the app in development

```bash
npm run dev
```

The server will start on `http://localhost:5000`.

## Deployment with Docker Compose (SRE Stack)

This project is containerized with separate frontend and backend services plus a full observability stack.

### 1. Build and start everything

```bash
docker compose up --build
```

Services started:

- `frontend` (Nginx reverse proxy) on `http://localhost:3000`
- `backend` (Node.js + Express) on `http://localhost:5000`
- `mongo` (MongoDB) on `mongodb://localhost:27017`
- `prometheus` on `http://localhost:9090`
- `grafana` on `http://localhost:3001` (admin/admin)
- `node-exporter` on `http://localhost:9100`

Use `http://localhost:3000` as the main entrypoint.

### 2. Environment variables in Docker

The `backend` service uses:

- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI=mongodb://mongo:27017/webapp`
- `JWT_SECRET=super-secret-change-me` (change for real deployments)
- `JWT_EXPIRES_IN=1h`

### 3. Monitoring and alerting

- Prometheus scrapes `backend:5000/metrics`, `node-exporter:9100`, and itself.
- Alert rules are loaded from `alert_rules.yml`.
- Grafana datasource and dashboard are auto-provisioned from `provisioning/`.

### 3. Production deployment

For deployment on a platform like Render, Railway, or similar:

1. Build the Docker image from the `Dockerfile` or let the platform handle it.
2. Configure environment variables (`PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`).
3. Ensure the app listens on `PORT` (already handled in `src/server.js`).
4. Point your browser to the deployed URL.

> **Deployed project URL**: _Add your deployed URL here after deployment._

## API Documentation

Base URL (development):

- `http://localhost:5000/api`

All protected endpoints require an `Authorization` header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Auth (Public)

#### POST `/api/auth/register`

Register a new user and receive a JWT.

- **Body (JSON)**:

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

- **Responses**:
  - `201 Created`:

```json
{
  "user": {
    "_id": "...",
    "username": "alice",
    "email": "alice@example.com",
    "role": "user",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "<JWT_TOKEN>"
}
```

  - `400 Bad Request` – validation error or user already exists

#### POST `/api/auth/login`

Authenticate a user and receive a JWT.

- **Body (JSON)**:

```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

- **Responses**:
  - `200 OK` – user info + token
  - `401 Unauthorized` – invalid credentials

### User Management (Private)

#### GET `/api/users/profile`

Retrieve the logged-in user's profile.

- **Headers**:

```http
Authorization: Bearer <JWT_TOKEN>
```

- **Response**:

```json
{
  "_id": "...",
  "username": "alice",
  "email": "alice@example.com",
  "role": "user",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### PUT `/api/users/profile`

Update the logged-in user's profile.

- **Headers**:

```http
Authorization: Bearer <JWT_TOKEN>
```

- **Body (JSON)** (all optional, but `password` requires `currentPassword`):

```json
{
  "username": "newName",
  "email": "new@example.com",
  "password": "newPassword123",
  "currentPassword": "oldPassword123"
}
```

- **Responses**:
  - `200 OK` – updated user profile
  - `400 Bad Request` – validation error or wrong current password
  - `401 Unauthorized` – missing/invalid token

### Posts Resource (Private)

All posts are associated with the logged-in user as `author`.

#### POST `/api/posts`

Create a new post.

- **Headers**:

```http
Authorization: Bearer <JWT_TOKEN>
```

- **Body (JSON)**:

```json
{
  "title": "My first post",
  "content": "This is the content.",
  "category": "<CATEGORY_ID_OR_NULL>",
  "tags": ["intro", "hello"],
  "status": "draft"
}
```

- **Responses**:
  - `201 Created` – created post
  - `400 Bad Request` – validation error

#### GET `/api/posts`

Retrieve all posts for the logged-in user.

- **Headers**:

```http
Authorization: Bearer <JWT_TOKEN>
```

- **Response**:

```json
[
  {
    "_id": "...",
    "title": "My first post",
    "content": "This is the content.",
    "author": "...",
    "status": "draft",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

#### GET `/api/posts/:id`

Retrieve a specific post by its ID (only if you are the author or an admin).

- **Headers**:

```http
Authorization: Bearer <JWT_TOKEN>
```

- **Responses**:
  - `200 OK` – post object
  - `403 Forbidden` – not your post and you are not admin
  - `404 Not Found` – post not found

#### PUT `/api/posts/:id`

Update a specific post (only if you are the author or an admin).

- **Headers**:

```http
Authorization: Bearer <JWT_TOKEN>
```

- **Body (JSON)** (all optional):

```json
{
  "title": "Updated title",
  "content": "Updated content",
  "categoryId": "<CATEGORY_ID_OR_NULL>",
  "categoryName": "Optional new category name",
  "tags": ["updated", "tags"],
  "status": "published"
}
```

- **Responses**:
  - `200 OK` – updated post
  - `403 Forbidden` – no permission
  - `404 Not Found` – post not found

#### DELETE `/api/posts/:id`

Delete a specific post by ID. **Only the post author or a user with role `admin` can delete.**

- **Headers**:

```http
Authorization: Bearer <JWT_TOKEN>
```

- **Responses**:
  - `204 No Content` – deleted successfully
  - `403 Forbidden` – not author and not admin
  - `404 Not Found` – post not found

### Categories

- **GET `/api/categories`** – List all categories (public).
- **GET `/api/categories/:id`** – Get one category (public).
- **POST `/api/categories`** – Create category (protected). Body: `{ "name": "Tech", "description": "optional" }`.
- **PUT `/api/categories/:id`** – Update category (protected).
- **DELETE `/api/categories/:id`** – Delete category only if no posts use it (protected).

### Comments

- **GET `/api/comments/posts/:postId/comments`** – List comments for a post (public).
- **POST `/api/comments/posts/:postId/comments`** – Add comment (protected). Body: `{ "content": "..." }`.
- **PUT `/api/comments/:id`** – Update comment (author or admin only).
- **DELETE `/api/comments/:id`** – Delete comment (author or admin only).

### Public posts

- **GET `/api/posts/public`** – List all published posts (no auth). Returns posts with author, category, and comment count.
- **GET `/api/posts/:id`** – Without auth returns the post only if it is published (with comments and authors).

## Pages (EJS + Bootstrap)

These routes return HTML views and use a shared Bootstrap layout:

- `GET /` – **Home Page**
  - Welcomes the user and describes the app
  - Shows sample “recent posts” cards
- `GET /auth/login` – **Login Page**
  - Login form that calls `POST /api/auth/login` via front-end JS
- `GET /auth/register` – **Register Page**
  - Registration form that calls `POST /api/auth/register` via front-end JS
- `GET /dashboard` – **User Dashboard**
  - Profile summary, your posts (with View/Edit/Delete), create/edit post modal (with category select or new category name), and category list (add/delete; delete only when no posts).
- `GET /posts/:id` – **Post Detail Page**
  - Full post with author and category; comments list with author; add comment (when logged in); edit/delete own comments (or admin).
- `GET /admin` – **Admin Panel (view)**
  - Admin-only conceptual page; API-level RBAC is enforced for destructive actions like deleting posts.

## Validation & Error Handling

- **Validation**:
  - Implemented using Joi schemas in `src/validators/*`
  - Applied via a generic `validate(schema)` middleware (`src/middleware/validationMiddleware.js`)
  - Returns `400 Bad Request` with combined validation error messages
- **Global Error Handler**:
  - All controllers use `try/catch` and `next(err)` on errors
  - `src/middleware/errorMiddleware.js` normalizes errors and returns JSON:
    - `message` – error message
    - `stack` – only in non-production environments
  - 404 handled by `notFound` middleware

## Role-Based Access Control (RBAC)

- Users have a `role` field (`'user'` or `'admin'`) as a string on the `User` model (no separate Role collection).
- Controllers perform explicit checks (e.g. `req.user.role === 'admin'`, or author vs admin for delete).
- `src/middleware/roleMiddleware.js` provides `authorizeRoles(...roles)` for route-level checks.
- JWT payload includes `role` so the middleware can enforce permissions.

## Notes for Defence

Be prepared to explain:

- How JWT authentication works:
  - Login issues a token, token is sent via `Authorization` header, `authMiddleware` verifies and attaches `req.user`.
- How RBAC is enforced:
  - `roleMiddleware` checks `req.user.role` and returns 403 when insufficient.
- How collections relate:
  - `User` ↔ `Post` (author), `User` ↔ `Comment` (author), `User` ↔ `Like` (user)
  - `Post` ↔ `Comment`, `Post` ↔ `Category`, `Post` ↔ `Like`
  - Role is a string field on `User` (`'user'` or `'admin'`), not a separate collection.
- How validation and global error handling are wired into Express.
- How the front-end dashboard calls the API using `public/js/main.js`.

