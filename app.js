const config = require("./config")
global.Promise = require("bluebird")

const logger = require("winston")
logger.level = config.log.level
logger.remove(logger.transports.Console)
logger.add(logger.transports.Console, {colorize: true})

// If settings present, start New Relic
var env = require('./services/environment.js')();
if (env.NEW_RELIC_APP_NAME && env.NEW_RELIC_LICENSE_KEY) {
  logger.info('Activating New Relic: ', env.NEW_RELIC_APP_NAME);
  require('newrelic');
} else {
  logger.warn("Skipping New Relic Activation")
}

const express = require("express")
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const expressWinston = require("express-winston")
const session = require("express-session")
const RedisStore = require("connect-redis")(session)
const responses = require("./api/responses")

const app = express()

if (config.redis) {
  config.session.store = new RedisStore(config.redis)
} else {
  config.session.store = new session.MemoryStore()
}

app.use(session(config.session))
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(methodOverride())
app.use(responses)

if (logger.levels[logger.level] >= 2) {
  app.use(expressWinston.logger({
    transports: [
      new logger.transports.Console({ colorize: true })
    ],
    requestWhitelist: expressWinston.requestWhitelist.concat("body"),
  }))
}
app.use(expressWinston.errorLogger({
  transports: [
    new logger.transports.Console({ json: true, colorize: true })
  ],
}))

const routers = require("./api/routers")
app.use(routers)

module.exports = app
