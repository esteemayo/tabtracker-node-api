const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const YAML = require('yamljs');
const swaggerUI = require('swagger-ui-express');

const swaggerDocument = YAML.load('./swagger.yaml');

// routes
const auth = require('./routes/auth');
const user = require('./routes/users');
const song = require('./routes/songs');
const history = require('./routes/history');
const bookmark = require('./routes/bookmarks');
const NotFoundError = require('./errors/notFound');
const errorHandlerMiddleware = require('./middlewares/errorHandler');

// passport
// require('./config/passport');

// start express app
const app = express();
console.log(app.get('env'));

// global middleware

// implement CORS
app.use(cors());
// access-control-allow-origin
app.options('*', cors());

// set security HTTP headers
app.use(helmet());

// development logging
if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

// limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour!',
});

app.use('/api', limiter);

// body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// cookie parser middleware
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(hpp());

// compression middleware
app.use(compression());

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

// swagger
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send(`<h1>Tabtracker API</h1><a href="/api-docs">Documentation</a>`);
});

// api routes
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', user);
app.use('/api/v1/songs', song);
app.use('/api/v1/histories', history);
app.use('/api/v1/bookmarks', bookmark);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(errorHandlerMiddleware);

module.exports = app;
