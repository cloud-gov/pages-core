const env = require("../../services/environment")()
const cfenv = require("cfenv")

const appEnv = cfenv.getAppEnv()

// Grunt config
module.exports = {
  grunt: {
    _hookTimeout: 60 * 1000,
  }
}

// Session Config
const redisCreds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-redis`)
if (redisCreds) {
  module.exports.session = {
    cookie: {
      secure: true,
    },
    proxy: true,
    secret: env.FEDERALIST_SESSION_SECRET,
    adapter: 'connect-redis',
    host: redisCreds.hostname,
    port: redisCreds.port,
    db: 0,
    pass: redisCreds.password,
  }
} else {
  throw new Error("No redis credentials found.")
}
