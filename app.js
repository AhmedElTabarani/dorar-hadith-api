const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const timeout = require('connect-timeout');

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
const swaggerDocument = YAML.load('api-docs/openapi.yaml');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(timeout(config.expressTimeout));
app.use(express.json({ limit: config.expressJsonLimit }));

// Rate Limiting
app.use(
  rateLimit({
    windowMs: config.rateLimitEach,
    max: config.rateLimitMax,
    message: 'Rate limit exceeded. Please try again later.',
    handler: (req, res, next, option) => {
      next(new AppError(option.message, 429));
    },
  }),
);

// Request Processing Middleware
app.use((req, res, next) => {
  // Handle timeout
  if (req.timedout) {
    return next(new AppError('Request timeout', 408));
  }

  // Process removeHTML parameter
  req.isRemoveHTML = req.query.removehtml || true;
  req.isRemoveHTML =
    req.query.removehtml?.toLowerCase() === 'false' ? false : true;
  
  delete req.query.removehtml;

  // Process specialist parameter
  req.isForSpecialist = req.query.specialist || false;
  req.isForSpecialist =
    req.query.specialist?.toLowerCase() === 'true' ? true : false;
  req.tab = req.isForSpecialist ? 'specialist' : 'home';

  delete req.query.specialist;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.status(302).redirect('/docs');
});
app.get('/docs', docs);

app.use('/v1', hadithSearchRouter);
app.use('/v1', sharhSearchRouter);
app.use('/v1', mohdithSearchRouter);
app.use('/v1', bookSearchRouter);
app.use('/v1', dataRouter);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
