const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const IORedis = require('ioredis');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const {
  ArchiveBuildLogsQueue,
  BuildTasksQueue,
  CreateEditorSiteQueue,
  DomainQueue,
  FailStuckBuildsQueue,
  MailQueue,
  NightlyBuildsQueue,
  SiteBuildsQueue,
  SiteDeletionQueue,
  ScheduledQueue,
  TimeoutBuildTasksQueue,
} = require('../queues');

const passport = require('./passport');
const sessionConfig = require('./sessionConfig');
const config = require('./config');
const { expressErrorLogger, expressLogger } = require('./winston');
const cacheControl = require('./cacheControl');

const connection = new IORedis(config.redis.url, {
  tls: config.redis.tls,
  maxRetriesPerRequest: null,
});

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [
    new BullMQAdapter(new SiteBuildsQueue(connection)),
    new BullMQAdapter(new ArchiveBuildLogsQueue(connection)),
    new BullMQAdapter(new BuildTasksQueue(connection)),
    new BullMQAdapter(new CreateEditorSiteQueue(connection)),
    new BullMQAdapter(new DomainQueue(connection)),
    new BullMQAdapter(new FailStuckBuildsQueue(connection)),
    new BullMQAdapter(new MailQueue(connection)),
    new BullMQAdapter(new NightlyBuildsQueue(connection)),
    new BullMQAdapter(new SiteDeletionQueue(connection)),
    new BullMQAdapter(new ScheduledQueue(connection)),
    new BullMQAdapter(new TimeoutBuildTasksQueue(connection)),
  ],
  serverAdapter,
});

const app = express();

app.enable('trust proxy');

app.disable('x-powered-by');

app.use(helmet(config.helmet));
app.use(slowDown(config.rateSlowing));
app.use(rateLimit(config.rateLimiting));
app.use(expressLogger);
app.use(sessionConfig());
app.use(passport.initialize());
app.use(passport.session());
app.use(cacheControl('max-age=0'));

function onSuccess(req, res) {
  req.session.authenticated = true;
  req.session.authenticatedAt = new Date();
  req.session.save(() => {
    res.redirect(req.session.authRedirectPath || '/queues');
  });
}

function ensureAuthenticated(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect('/login');
  }
  return next();
}

function redirectIfAuthenticated(req, res, next) {
  return req.session.authenticated ? res.redirect('/queues') : next();
}

const idp = 'uaa';

app.get('/login', redirectIfAuthenticated, passport.authenticate(idp));
app.get('/logout', passport.logout(idp));
app.get(
  '/auth/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/loggedout',
  }),
  onSuccess,
);

if (idp === 'uaa') {
  app.get('/auth/uaa/callback', passport.authenticate('uaa'), onSuccess);
  app.get('/auth/uaa/logout', (_req, res) => res.redirect('/loggedout'));
}

app.get('/', (_, res) => res.redirect('/queues'));
app.get('/loggedout', (_, res) =>
  res.send(`
  <h1>You have been logged out</h1>
  <a href="/login">login</a>
`),
);

serverAdapter.setBasePath('/queues');
app.use('/queues', ensureAuthenticated, serverAdapter.getRouter());

app.use(expressErrorLogger);

module.exports = app;
