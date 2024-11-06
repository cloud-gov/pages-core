const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const session = require('express-session');
const nunjucks = require('nunjucks');
const flash = require('connect-flash');
const helmet = require('helmet');

const { logger, expressLogger, expressErrorLogger } = require('../../winston');
const config = require('../../config');

const adminApi = require('../admin');
const externalAuth = require('../external-auth');
const {
  cacheControl,
  errorHandler,
  parseJson,
  xssProtection,
  fourOhFourHandler,
} = require('../middlewares');
const responses = require('../responses');
const passport = require('../services/passport');
const router = require('../routers');
const sessionConfig = require('./sessionConfig');

function randomNonce(_, res, next) {
  res.locals.cspNonce = crypto.randomBytes(16).toString('hex');
  next();
}

function configureViews(app) {
  nunjucks.configure('views', {
    autoescape: true,
    express: app,
  });
}

function setUserInLocals(req, res, next) {
  res.locals.user = req.user;
  return next();
}

function maybeUseExpressLogger(app) {
  if (logger.levels[logger.level] >= 2) {
    app.use(expressLogger);
  }
}

function init(app) {
  // When deployed we are behind a proxy, but we want to be
  // able to access the requesting user's IP in req.ip, so
  // 'trust proxy' must be enabled.
  app.enable('trust proxy');

  app.disable('x-powered-by');

  app.use(randomNonce);

  app.use(helmet(config.helmet));

  app.use(xssProtection);

  app.use(express.static('public'));

  app.use(slowDown(config.rateSlowing));
  app.use(rateLimit(config.rateLimiting));

  maybeUseExpressLogger(app);

  app.use('/admin', adminApi);

  app.use('/external', externalAuth);

  const main = express();
  main.disable('x-powered-by');
  configureViews(main);
  main.use(session(sessionConfig));
  main.use(passport.initialize());
  main.use(passport.session());
  main.use(setUserInLocals);
  main.use(parseJson);
  main.use(flash());
  main.use(responses);

  main.use(cacheControl('max-age=0'));

  main.use(router);
  main.use(fourOhFourHandler);
  main.use(expressErrorLogger);
  main.use(errorHandler);

  app.use('/', main);

  return app;
}

module.exports = init;
