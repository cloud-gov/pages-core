const { Store } = require('express-session');
const connectSession = require('connect-session-sequelize');

const config = require('../../config');
const { sequelize } = require('../models');

const PostgresStore = connectSession(Store);
const store = new PostgresStore({
  db: sequelize,
  modelKey: 'Sessions',
});

const sessionConfig = { ...config.session, store };

module.exports = sessionConfig;
