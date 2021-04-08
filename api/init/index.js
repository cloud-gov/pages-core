const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const session = require('express-session');
const nunjucks = require('nunjucks');
const flash = require('connect-flash');

const { logger, expressLogger, expressErrorLogger } = require('../../winston');
const config = require('../../config');

const adminApi = require('../admin');
const externalAuth = require('../external-auth');
const responses = require('../responses');
const passport = require('../services/passport');
const router = require('../routers');
const devMiddleware = require('../services/devMiddleware');
const EventCreator = require('../services/EventCreator');
const sessionConfig = require('./sessionConfig');

const { NODE_ENV } = process.env;

function configureViews(app) {
  nunjucks.configure('views', {
    autoescape: true,
    express: app,
  });
}

function maybeUseDevMiddleware(app) {
  if (NODE_ENV === 'development') {
    app.use(devMiddleware());
  }
}

function setUserInLocals(req, res, next) {
  res.locals.user = req.user;
  return next();
}

function cacheControl(req, res, next) {
  res.set('Cache-Control', 'max-age=0');
  next();
}

function maybeUseExpressLogger(app) {
  if (logger.levels[logger.level] >= 2) {
    app.use(expressLogger);
  }
}

function fourOhFourhandler(req, res) {
  res.status(404).redirect(302, '/404-not-found/');
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  EventCreator.handlerError(req, err);
  if (!res.headersSent) {
    res.error(err);
  }
}

function init(app) {
  // When deployed we are behind a proxy, but we want to be
  // able to access the requesting user's IP in req.ip, so
  // 'trust proxy' must be enabled.
  app.enable('trust proxy');

  app.use(express.static('public'));

  app.use(slowDown(config.rateSlowing));
  app.use(rateLimit(config.rateLimiting));

  maybeUseExpressLogger(app);

  app.use('/admin', adminApi);

  app.use('/external', externalAuth);

  const main = express();
  configureViews(main);
  maybeUseDevMiddleware(main);
  main.use(session(sessionConfig));
  main.use(passport.initialize());
  main.use(passport.session());
  main.use(setUserInLocals);
  main.use(bodyParser.urlencoded({ extended: false }));
  main.use(bodyParser.json({ limit: '2mb' }));
  main.use(methodOverride());
  main.use(flash());
  main.use(responses);

  main.use(cacheControl);

  main.use(router);
  main.use(fourOhFourhandler);
  main.use(expressErrorLogger);
  main.use(errorHandler);

  app.use('/', main);

  return app;
}

module.exports = init;
