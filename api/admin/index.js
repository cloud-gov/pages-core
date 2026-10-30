const cors = require('cors');
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const config = require('../../config');
const { logger, expressErrorLogger } = require('../../winston');

const { cacheControl, errorHandler } = require('../middlewares');
const responses = require('../responses');

const passport = require('./passport');
const { apiRouter, authRouter } = require('./routers');
const sessionConfig = require('./sessionConfig');

// Rate limiting for all admin requests
const ADMIN_API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ADMIN_API_RATE_LIMIT_MAX_REQUESTS = 100; // per window

// Stricter rate limiting for auth endpoints
const ADMIN_AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ADMIN_AUTH_RATE_LIMIT_MAX_FAILED_ATTEMPTS = 10; // per window

// Delay admin requests past the threshold, adding one step per extra request
// (200ms, 400ms, ...) up to the max delay
const ADMIN_API_SLOW_DOWN_WINDOW_MS = 1 * 60 * 1000; // 1 minute
const ADMIN_API_SLOW_DOWN_REQUESTS_BEFORE_DELAY = 10; // per window
const ADMIN_API_SLOW_DOWN_DELAY_STEP_MS = 200;
const ADMIN_API_SLOW_DOWN_MAX_DELAY_MS = 5000;

const logRateLimitExceeded = (limiter) => (req, res, next, options) => {
  const request = `${req.method} ${req.baseUrl}${req.path}`;
  logger.warn(`Admin ${limiter} rate limit exceeded: ${request} from ${req.ip}`);
  res.status(options.statusCode).send(options.message);
};

const adminRateLimit = rateLimit({
  windowMs: ADMIN_API_RATE_LIMIT_WINDOW_MS,
  max: ADMIN_API_RATE_LIMIT_MAX_REQUESTS,
  message: { error: 'Too many admin requests, please try again later.' },
  standardHeaders: false,
  legacyHeaders: false,
  handler: logRateLimitExceeded('API'),
});

const authRateLimit = rateLimit({
  windowMs: ADMIN_AUTH_RATE_LIMIT_WINDOW_MS,
  max: ADMIN_AUTH_RATE_LIMIT_MAX_FAILED_ATTEMPTS,
  message: { error: 'Too many authentication attempts.' },
  skipSuccessfulRequests: true,
  standardHeaders: false,
  legacyHeaders: false,
  handler: logRateLimitExceeded('auth'),
});

const adminSlowDown = slowDown({
  windowMs: ADMIN_API_SLOW_DOWN_WINDOW_MS,
  delayAfter: ADMIN_API_SLOW_DOWN_REQUESTS_BEFORE_DELAY,
  delayMs: (hits) =>
    (hits - ADMIN_API_SLOW_DOWN_REQUESTS_BEFORE_DELAY) *
    ADMIN_API_SLOW_DOWN_DELAY_STEP_MS,
  maxDelayMs: ADMIN_API_SLOW_DOWN_MAX_DELAY_MS,
});

const corsCfg = {
  origin: config.app.adminHostname,
  credentials: true,
};

const app = express();
app.disable('x-powered-by');

app.use(adminSlowDown);
app.use(adminRateLimit);

app.use(cors(corsCfg));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(cacheControl('no-store'));
app.use(responses);

app.use('/auth', authRateLimit);
app.use(authRouter);
app.use(apiRouter);
app.use(expressErrorLogger);
app.use(errorHandler);

module.exports = app;

Object.assign(module.exports, {
  ADMIN_API_RATE_LIMIT_MAX_REQUESTS,
  ADMIN_AUTH_RATE_LIMIT_MAX_FAILED_ATTEMPTS,
});
