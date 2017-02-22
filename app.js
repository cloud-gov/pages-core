global.config = require("./config")

Object.assign(global, require("./api/models"))
global.sequelize = Build.sequelize

global.Promise = require("bluebird")

// If settings present, start New Relic
var env = require('./services/environment.js')();
if (env.NEW_RELIC_APP_NAME && env.NEW_RELIC_LICENSE_KEY) {
  console.log('Activating New Relic: ', env.NEW_RELIC_APP_NAME);
  require('newrelic');
}

const express = require("express")
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const morgan = require("morgan")
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
app.use(morgan("dev"))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(methodOverride())
app.use(responses)

const routers = require("./api/routers")
app.use(routers)

module.exports = app
