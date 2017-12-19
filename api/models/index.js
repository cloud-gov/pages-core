const Sequelize = require('sequelize');
const logger = require('winston');
const config = require('../../config');
const path = require('path');

const postgresConfig = config.postgres;
const database = postgresConfig.database;
const username = postgresConfig.user;
const password = postgresConfig.password;

const sequelize = new Sequelize(database, username, password, {
  dialect: 'postgres',
  host: postgresConfig.host,
  port: postgresConfig.port,
  logging: logger.info,
});

const Build = sequelize.import(path.join(__dirname, '/build')); // eslint-disable-line no-unused-vars
const BuildLog = sequelize.import(path.join(__dirname, '/build-log')); // eslint-disable-line no-unused-vars
const Site = sequelize.import(path.join(__dirname, '/site')); // eslint-disable-line no-unused-vars
const User = sequelize.import(path.join(__dirname, '/user')); // eslint-disable-line no-unused-vars
const UserAction = sequelize.import(path.join(__dirname, '/user-action')); // eslint-disable-line no-unused-vars

Object.keys(sequelize.models).forEach(key =>
  sequelize.models[key].associate(sequelize.models)
);

module.exports = Object.assign({ sequelize }, sequelize.models);
