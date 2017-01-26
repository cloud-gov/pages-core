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

const Build = sequelize.import(__dirname + "/build")
const BuildLog = sequelize.import(__dirname + "/build-log")
const Site = sequelize.import(__dirname + "/site")
const User = sequelize.import(__dirname + "/user")

Object.keys(sequelize.models).forEach(key => {
  sequelize.models[key].associate(sequelize.models)
})

module.exports = sequelize.models
