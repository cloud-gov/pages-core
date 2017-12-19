const Sequelize = require('sequelize');
const logger = require("winston");
const config = require("../../config");

const postgresConfig = config.postgres;
const database = postgresConfig.database;
const username = postgresConfig.user;
const password = postgresConfig.password;

const sequelize = new Sequelize(database, username, password, {
  dialect: "postgres",
  host: postgresConfig.host,
  port: postgresConfig.port,
  logging: logger.info,
});

Object.keys(sequelize.models).forEach(key =>
  sequelize.models[key].associate(sequelize.models)
);

module.exports = Object.assign({ sequelize }, sequelize.models);
