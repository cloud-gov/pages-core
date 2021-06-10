const { Store } = require('express-session');
const connectSession = require('connect-session-sequelize');

const origSessionConfig = require('../../config/session');

const { sequelize } = require('../models');

const PostgresStore = connectSession(Store);
const store = new PostgresStore({
  db: sequelize,
  modelKey: 'Sessions',
});

const sessionConfig = { ...origSessionConfig, store };

module.exports = sessionConfig;

module.exports = {
  ...sessionConfig,
  name: 'federalist-bull-board.sid',
  // I think we only need `name`, but adding `key` for legacy
  key: 'federalist-bull-board.sid',
  // Use a different secret
  secret: `${sessionConfig.secret}bull-board`,
};
