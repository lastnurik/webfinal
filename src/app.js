const path = require('path');
const express = require('express');
const cors = require('cors');
const client = require('prom-client');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Route modules
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const commentRoutes = require('./routes/commentRoutes');
const pageRoutes = require('./routes/pageRoutes');

const app = express();

const metricsRegistry = new client.Registry();
client.collectDefaultMetrics({ register: metricsRegistry });

const httpRequestsTotal = new client.Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status'],
	registers: [metricsRegistry],
});

const httpRequestDurationSeconds = new client.Histogram({
	name: 'http_request_duration_seconds',
	help: 'HTTP request duration in seconds',
	labelNames: ['method', 'route', 'status'],
	buckets: [0.1, 0.3, 0.5, 1, 2, 5],
	registers: [metricsRegistry],
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((req, res, next) => {
	const start = process.hrtime.bigint();

	res.on('finish', () => {
		const durationNs = process.hrtime.bigint() - start;
		const durationSeconds = Number(durationNs) / 1e9;
		const status = String(res.statusCode);
		const matchedRoute = req.route ? `${req.baseUrl || ''}${req.route.path}` : req.path;

		httpRequestsTotal.inc({
			method: req.method,
			route: matchedRoute,
			status,
		});

		httpRequestDurationSeconds.observe(
			{
				method: req.method,
				route: matchedRoute,
				status,
			},
			durationSeconds
		);
	});

	next();
});

app.get('/metrics', async (req, res, next) => {
	try {
		res.set('Content-Type', metricsRegistry.contentType);
		const metrics = await metricsRegistry.metrics();
		res.send(metrics);
	} catch (err) {
		next(err);
	}
});

if (process.env.ENABLE_SRE_TEST_ENDPOINT === 'true') {
	app.get('/api/sre/fail', (req, res) => {
		res.status(500).json({ message: 'Intentional test failure for alert validation' });
	});
}

// Page routes (EJS views)
app.use('/', pageRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

