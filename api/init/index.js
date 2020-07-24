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

const adminApp = require('../admin');
const responses = require('../responses');
const passport = require('../services/passport');
const router = require('../routers');
const devMiddleware = require('../services/devMiddleware');

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

function frRedirect(req, res, next) {
  const host = req.hostname;
  const redirectUrls = [
    'federalist.fr.cloud.gov',
    'federalist-staging.fr.cloud.gov',
  ];

  if (redirectUrls.indexOf(host) !== -1) {
    return res.redirect(301, `https://${host.slice().replace('fr.cloud', '18f')}`);
  }

  return next();
}

function federalistAppRedirect(req, res, next) {
  const host = req.hostname;
  const redirectUrls = [
    'federalist.18f.gov',
    'federalist-staging.18f.gov',
  ];

  if (redirectUrls.indexOf(host) !== -1) {
    return res.redirect(302, `https://${host.slice().replace('federalist', 'federalistapp')}`);
  }

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
function errorHandler(err, _req, res, _next) {
  res.error(err);
}

function init(app) {
  // configureViews(app);

  // When deployed we are behind a proxy, but we want to be
  // able to access the requesting user's IP in req.ip, so
  // 'trust proxy' must be enabled.
  app.enable('trust proxy');

  app.use(express.static('public'));

  // const mainRouter = express.Router();
  // maybeUseDevMiddleware(mainRouter);
  // mainRouter.use(session(sessionConfig));
  // mainRouter.use(passport.initialize());
  // mainRouter.use(passport.session());
  // mainRouter.use(setUserInLocals);
  // mainRouter.use(bodyParser.urlencoded({ extended: false }));
  // mainRouter.use(bodyParser.json({ limit: '2mb' }));
  // mainRouter.use(methodOverride());
  // mainRouter.use(flash());
  // mainRouter.use(responses);

  // mainRouter.use(frRedirect);

  // temporary until federalist.18f.gov is launched
  // mainRouter.use(federalistAppRedirect);

  // mainRouter.use(cacheControl);

  // maybeUseExpressLogger(mainRouter);

  // mainRouter.use(slowDown(config.rateSlowing));
  // mainRouter.use(rateLimit(config.rateLimiting));
  // mainRouter.use(router);
  // mainRouter.use(fourOhFourhandler);
  // mainRouter.use(expressErrorLogger);
  // mainRouter.use(errorHandler);

  app.use('/admin', adminApp);
  // app.use('/', mainRouter);

  return app;
}

module.exports = init;
