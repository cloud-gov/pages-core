const Sequelize = require('sequelize');

const postgresConfig = sails.config.connections.postgres
const database = postgresConfig.database
const username = postgresConfig.username
const password = postgresConfig.password

const sequelize = new Sequelize(database, username, password, {
  dialect: "postgres",
  host: postgresConfig.host,
  port: postgresConfig.port,
})

module.exports = sequelize
