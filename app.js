const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const session = require('express-session');
const ConnectSession = require('connect-session-sequelize');
const nunjucks = require('nunjucks');
const flash = require('connect-flash');
const http = require('http');
const io = require('socket.io');
const redis = require('redis');
const redisAdapter = require('socket.io-redis');
const schedule = require('node-schedule');
const responses = require('./api/responses');
const passport = require('./api/services/passport');
const { logger, expressLogger, expressErrorLogger } = require('./winston');
const config = require('./config');
const router = require('./api/routers');
const devMiddleware = require('./api/services/devMiddleware');
const SocketIOSubscriber = require('./api/services/SocketIOSubscriber');
const jwtHelper = require('./api/services/jwtHelper');
const FederalistUsersHelper = require('./api/services/FederalistUsersHelper');
const RepositoryVerifier = require('./api/services/RepositoryVerifier');
const SiteUserAuditor = require('./api/services/SiteUserAuditor');
const ScheduledBuildHelper = require('./api/services/ScheduledBuildHelper');
const { sequelize } = require('./api/models');

// If settings present, start New Relic
if (config.env.newRelicAppName && config.env.newRelicLicenseKey) {
  logger.info(`Activating New Relic: ${config.env.newRelicAppName}`);
  require('newrelic'); // eslint-disable-line global-require
} else {
  logger.warn('Skipping New Relic Activation');
}

const app = express();

const PostgresStore = ConnectSession(session.Store);
config.session.store = new PostgresStore({
  db: sequelize,
  modelKey: 'Sessions',
});

nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

// When deployed we are behind a proxy, but we want to be
// able to access the requesting user's IP in req.ip, so
// 'trust proxy' must be enabled.
app.enable('trust proxy');
app.use(express.static('public'));
if (process.env.NODE_ENV === 'development') {
  app.use(devMiddleware());
}
app.use(session(config.session));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user;
  return next();
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(methodOverride());
app.use(flash());
app.use(responses);

app.use((req, res, next) => {
  const host = req.hostname;
  const redirectUrls = [
    'federalist.fr.cloud.gov',
    'federalist-staging.fr.cloud.gov',
  ];

  if (redirectUrls.indexOf(host) !== -1) {
    return res.redirect(301, `https://${host.slice().replace('fr.cloud', '18f')}`);
  }

  return next();
});

// temporary until federalist.18f.gov is launched
app.use((req, res, next) => {
  const host = req.hostname;
  const redirectUrls = [
    'federalist.18f.gov',
    'federalist-staging.18f.gov',
  ];

  if (redirectUrls.indexOf(host) !== -1) {
    return res.redirect(302, `https://${host.slice().replace('federalist', 'federalistapp')}`);
  }

  return next();
});

app.use((req, res, next) => {
  res.set('Cache-Control', 'max-age=0');
  next();
});

if (logger.levels[logger.level] >= 2) {
  app.use(expressLogger);
}

const rateLimiter = rateLimit(config.rateLimiting);
const speedLimiter = slowDown(config.rateSlowing);
// must be set before router is added to app
app.use(speedLimiter);
app.use(rateLimiter);

app.server = http.createServer(app);

const socketIO = io(app.server, { cookie: false });
if (config.redis) {
  const pubClient = redis.createClient(config.redis);
  const subClient = redis.createClient(config.redis);

  socketIO.adapter(redisAdapter({ pubClient, subClient }));

  pubClient.on('error', (err) => {
    logger.error(`redisAdapter pubClient error: ${err}`);
  });
  subClient.on('error', (err) => {
    logger.error(`redisAdapter subClient error: ${err}`);
  });
  socketIO.of('/').adapter.on('error', (err) => {
    logger.error(`redisAdapter error: ${err}`);
  });
}

app.use((req, res, next) => {
  // eslint-disable-next-line no-underscore-dangle
  res._socketIO = socketIO;
  next();
});

app.use(router);

app.use((req, res) => res.status(404).redirect(302, '/404-not-found/'));

app.use(expressErrorLogger);

// eslint-disable-next-line
app.use((err, req, res, next) => {
  res.error(err);
});

socketIO.use((_socket, next) => {
  /* eslint-disable no-param-reassign */
  if (_socket.handshake.query && _socket.handshake.query.accessToken) {
    jwtHelper.verify(_socket.handshake.query.accessToken, { expiresIn: 60 * 60 * 24 }) // expire 24h
      .then((decoded) => {
        _socket.user = decoded.user;
      })
      .then(() => next())
      .catch((e) => {
        logger.warn(e);
        next();
      });
  } else {
    next();
  }
})
  .on('connection', (_socket) => {
    SocketIOSubscriber.joinRooms(_socket);
  })
  .on('error', (err) => {
    logger.error(`socket auth/subscribe error: ${err}`);
  });

if (process.env.CF_INSTANCE_INDEX === '0') {
  // verify site's repositories exist
  schedule.scheduleJob('10 0 * * *', () => {
    logger.info('Verifying Repos');
    RepositoryVerifier.verifyRepos()
      .catch(logger.error);
  });

  // audit users and remove sites w/o repo push permissions
  schedule.scheduleJob('15 0 * * *', () => {
    logger.info('Auditing All Sites');
    SiteUserAuditor.auditAllSites()
      .catch(logger.error);
  });

  if (config.app.app_env === 'production') {
    // audit federalist-users 18F teams daily at midnight
    schedule.scheduleJob('20 0 * * *', () => {
      logger.info('Auditing federalist-users 18F Staff & Org Teams');
      FederalistUsersHelper.audit18F({})
        .catch(logger.error);
    });
  }

  if (config.app.app_env === 'production') {
    // audit federalist-users 18F teams daily at midnight
    schedule.scheduleJob('0 0 * * *', () => {
      logger.info('Running nightlyBuilds');
      ScheduledBuildHelper.nightlyBuilds()
        .catch(logger.error);
    });
  }
}

module.exports = app;
