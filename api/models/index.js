const Sequelize = require('sequelize');
const path = require('path');
const config = require('../../config');
const { databaseLogger } = require('../../winston');

const postgresConfig = config.postgres;
const database = postgresConfig.database;
const username = postgresConfig.user;
const password = postgresConfig.password;

const sequelize = new Sequelize(database, username, password, {
  dialect: 'postgres',
  host: postgresConfig.host,
  port: postgresConfig.port,
  logging: databaseLogger.info.bind(databaseLogger),
});
/* eslint-disable no-unused-vars */
const Build = sequelize.import(path.join(__dirname, '/build'));
const BuildLog = sequelize.import(path.join(__dirname, '/build-log'));
const Site = sequelize.import(path.join(__dirname, '/site'));
const SiteUser = sequelize.import(path.join(__dirname, '/site-user'));
const User = sequelize.import(path.join(__dirname, '/user'));
const UserAction = sequelize.import(path.join(__dirname, '/user-action'));
const ActionType = sequelize.import(path.join(__dirname, '/action-type'));
const Scan = sequelize.import(path.join(__dirname, '/scan'));
/* eslint-enable no-unused-vars */

Object.keys(sequelize.models).forEach(key =>
  sequelize.models[key].associate(sequelize.models)
);

module.exports = Object.assign({ sequelize }, sequelize.models);
