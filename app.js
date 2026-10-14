const express = require('express');
const helmet = require('helmet');

const docs = require('./docs');
const hadithSearchRouter = require('./routes/hadithSearch.routes');
const sharhSearchRouter = require('./routes/sharhSearch.routes');
const mohdithSearchRouter = require('./routes/mohdithSearch.routes');
const bookSearchRouter = require('./routes/bookSearch.routes');
const dataRouter = require('./routes/data.routes');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(require('node:path').join(__dirname, 'api-docs/openapi.yaml'));

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', false); // Configure explicit proxy CIDRs at the edge; never trust arbitrary XFF.
app.use(helmet());
app.get('/health/live', (req, res) => res.json({ status: 'ok' }));
app.get('/health/ready', async (req, res) => {
  try { await require('./services/common/store').redis(); res.json({ status: 'ready' }); }
  catch { res.status(503).json({ status: 'unavailable' }); }
});
if (process.env.NODE_ENV === 'production' && (!process.env.SERVICE_API_KEY || !process.env.REDIS_URL)) {
  throw new Error('Production requires SERVICE_API_KEY and REDIS_URL');
}
app.use((req, res, next) => {
  const expected = process.env.SERVICE_API_KEY;
  const supplied = req.get('x-service-key') || '';
  const crypto = require('node:crypto');
  if (expected && (Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)))) {
    return res.status(401).json({ code: 'unauthorized', message: 'Service authentication required' });
  }
  next();
});
app.get('/metrics', (req, res) => res.type('text/plain').send(require('./utils/metrics').render()));
app.use((req, res, next) => { res.on('finish', () => require('./utils/metrics').add('http_' + Math.floor(res.statusCode / 100) + 'xx')); next(); });
app.use(express.json({ limit: config.expressJsonLimit }));
app.use((req, res, next) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  res.on('close', () => { clearTimeout(timer); controller.abort(); });
  require('./utils/requestContext').run({ signal: controller.signal }, next);
});

// Request Processing Middleware
app.use((req, res, next) => {
  // Handle timeout
  if (req.timedout) {
    return next(new AppError('Request timeout', 408));
  }

  for (const field of ['removehtml', 'specialist']) {
    if (req.query[field] !== undefined && (typeof req.query[field] !== 'string' || !['true', 'false'].includes(req.query[field].toLowerCase()))) return next(new AppError('Invalid boolean search parameter', 400));
  }
  // Process removeHTML parameter
  req.isRemoveHTML = req.query.removehtml || true;
  req.isRemoveHTML =
    String(req.query.removehtml).toLowerCase() === 'false' ? false : true;
  
  delete req.query.removehtml;

  // Process specialist parameter
  req.isForSpecialist = req.query.specialist || false;
  req.isForSpecialist =
    String(req.query.specialist).toLowerCase() === 'true' ? true : false;
  req.tab = req.isForSpecialist ? 'specialist' : 'home';

  delete req.query.specialist;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.status(302).redirect('/docs');
});
if (process.env.NODE_ENV !== 'production') app.get('/docs', docs);

app.use('/v1', hadithSearchRouter);
app.use('/v1', sharhSearchRouter);
app.use('/v1', mohdithSearchRouter);
app.use('/v1', bookSearchRouter);
app.use('/v1', dataRouter);

// Serve Swagger UI
if (process.env.NODE_ENV !== 'production') app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Set NODE_ENV for development if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Global Error Handler
app.use(errorHandler);

module.exports = app;
