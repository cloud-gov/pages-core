const express = require('express');
const session = require('express-session');
const Queue = require('bull');
const { Queue: QueueMQ } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const IORedis = require('ioredis');
const passport = require('./passport');
const sessionConfig = require('./sessionConfig');
const config = require('./config');
const { expressErrorLogger, logger } = require('./winston');

const connection = new IORedis(config.redis.url);

const createQueue = name => new Queue(name, config.redis.url);
const createQueueMQ = name => new QueueMQ(name, { connection });

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [
    new BullAdapter(createQueue('site-build-queue')),
    new BullMQAdapter(createQueueMQ('scheduled')),
  ],
  serverAdapter,
});

const app = express();

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

function onSuccess(req, res) {
  req.session.authenticated = true;
  req.session.authenticatedAt = new Date();
  req.session.save(() => {
    res.redirect(req.session.authRedirectPath || '/');
  });
}

function ensureAuthenticated(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect('/login');
  }
  return next();
}

function redirectIfAuthenticated(req, res, next) {
  // eslint-disable-next-line no-unused-expressions
  req.session.authenticated ? res.redirect('/') : next();
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (!err) {
    _next();
  }
  logger.error(err.stack);
  res.error(err);
}
// eslint-disable-next-line no-unused-vars
function logRequests(req, res, _next) {
  logger.info(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
  _next();
}

app.use(errorHandler);
app.use(logRequests);
app.get('/logout', passport.logout);
app.get('/login', redirectIfAuthenticated, passport.authenticate('uaa'));

// Callbacks need to be registered with CF UAA service
app.get('/auth/uaa/callback', passport.authenticate('uaa'), onSuccess);
app.get('/auth/uaa/logout', (_req, res) => res.redirect('/'));

app.use('/', ensureAuthenticated, serverAdapter.getRouter());

app.use(expressErrorLogger);

module.exports = app;
