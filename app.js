const config = require('./config');

const logger = require('winston');

logger.level = config.log.level;
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { colorize: true });

// If settings present, start New Relic
const env = require('./services/environment.js')();

if (env.NEW_RELIC_APP_NAME && env.NEW_RELIC_LICENSE_KEY) {
  logger.info(`Activating New Relic: ${env.NEW_RELIC_APP_NAME}`);
  require('newrelic'); // eslint-disable-line global-require
} else {
  logger.warn('Skipping New Relic Activation');
}

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const expressWinston = require('express-winston');
const session = require('express-session');
const PostgresStore = require('connect-session-sequelize')(session.Store);
const nunjucks = require('nunjucks');
const flash = require('connect-flash');

const responses = require('./api/responses');
const passport = require('./api/services/passport');
const RateLimit = require('express-rate-limit');
const router = require('./api/routers');

const app = express();
const sequelize = require('./api/models').sequelize;

const redirectUrls = [
  'federalist.fr.cloud.gov',
  'federalist-staging.fr.cloud.gov',
];

config.session.store = new PostgresStore({ db: sequelize });

nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

// When deployed we are behind a proxy, but we want to be
// able to access the requesting user's IP in req.ip, so
// 'trust proxy' must be enabled.
app.enable('trust proxy');

app.use(session(config.session));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user;
  return next();
});

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(methodOverride());
app.use(flash());
app.use(responses);

app.use((req, res, next) => {
  const host = req.hostname;

  if (redirectUrls.indexOf(host) !== -1) {
    return res.redirect(301, `https://${host.slice().replace('fr.cloud', '18f')}`);
  }

  return next();
});

app.use((req, res, next) => {
  res.set('Cache-Control', 'max-age=0');
  next();
});

if (logger.levels[logger.level] >= 2) {
  app.use(expressWinston.logger({
    transports: [
      new logger.transports.Console({ colorize: true }),
    ],
    requestWhitelist: expressWinston.requestWhitelist.concat('body'),
  }));
}
app.use(expressWinston.errorLogger({
  transports: [
    new logger.transports.Console({ json: true, colorize: true }),
  ],
}));

const limiter = new RateLimit(config.rateLimiting);
app.use(limiter); // must be set before router is added to app

// app.use(router);

// error handler middleware for custom CSRF error responses
// note that error handling middlewares must come last in the stack
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.forbidden({ message: 'Invalid CSRF token' });
    return;
  }

  next(err);
});

const server = require('http').Server(app);
server.listen(process.env.PORT || 1337, () => {
  logger.info("Server running!")
});

const io = require('socket.io')(server);
const redis = require('redis');
const redisAdapter = require('socket.io-redis');
const pub = redis.createClient(config.redis.port, config.redis.hostname, { auth_pass: config.redis.password });
const sub = redis.createClient(config.redis.port, config.redis.hostname, { auth_pass: config.redis.password });
io.adapter(redisAdapter({ pubClient: pub, subClient: sub }));
// const redisAdapter = require('socket.io-redis');
// io.adapter(redisAdapter({ host: config.redis.hostname, port: config.redis.port }));
// io.adapter(redisAdapter({ host: 'redis', port: 6379 }));
// io.on('connection', function(socket){
  // console.log('\n\na user connected\n\n');
//   socket.on('disconnect', function(){
//     console.log('\n\nuser disconnected\n\n');
//   });
// });

app.use((req, res, next) => {
    res.io = io;
    next();
});

app.use(router);
module.exports = app;