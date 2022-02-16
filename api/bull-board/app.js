const express = require('express');
const session = require('express-session');
const Queue = require('bull');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const IORedis = require('ioredis');
const helmet = require('helmet');

const {
  DomainQueue, MailQueue, ScheduledQueue, SlackQueue,
} = require('../queues');

const passport = require('./passport');
const sessionConfig = require('./sessionConfig');
const config = require('./config');
const { expressErrorLogger, expressLogger } = require('./winston');

const connection = new IORedis(config.redis.url, {
  tls: config.redis.tls,
});

const createQueue = name => new Queue(name, config.redis.url, {
  redis: {
    tls: config.redis.tls,
  },
});

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [
    new BullAdapter(createQueue('site-build-queue')),
    new BullMQAdapter(new DomainQueue(connection)),
    new BullMQAdapter(new MailQueue(connection)),
    new BullMQAdapter(new SlackQueue(connection)),
    new BullMQAdapter(new ScheduledQueue(connection)),
  ],
  serverAdapter,
});

const app = express();

app.enable('trust proxy');

app.disable('x-powered-by');

app.use(helmet(config.helmet));

app.use(expressLogger);
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

const idp = config.product === 'federalist' ? 'github' : 'uaa';

app.get('/login', redirectIfAuthenticated, passport.authenticate(idp));
app.get('/logout', passport.logout(idp));
app.get('/auth/github/callback', passport.authenticate('github', {
  failureRedirect: '/',
  failureFlash: true,
}), onSuccess);

if (idp === 'uaa') {
  app.get('/auth/uaa/callback', passport.authenticate('uaa'), onSuccess);
  app.get('/auth/uaa/logout', (_req, res) => res.redirect('/'));
}

app.use('/', ensureAuthenticated, serverAdapter.getRouter());

app.use(expressErrorLogger);

module.exports = app;
