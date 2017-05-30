const path = require('path');

const config = require('./config');

const logger = require('winston');

logger.level = config.log.level;
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { colorize: true });

// If settings present, start New Relic
const env = require('./services/environment.js')();

if (env.NEW_RELIC_APP_NAME && env.NEW_RELIC_LICENSE_KEY) {
  logger.info('Activating New Relic: ', env.NEW_RELIC_APP_NAME);
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
const responses = require('./api/responses');

const app = express();
const sequelize = require('./api/models').sequelize;

config.session.store = new PostgresStore({ db: sequelize });

app.engine('html', require('ejs').renderFile);

app.use(session(config.session));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(responses);

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

const routers = require('./api/routers');

app.use(routers);

module.exports = app;
