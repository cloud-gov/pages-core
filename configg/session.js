const env = require("../services/environment")()

module.exports = {
  cookie: {
    secure: true,
  },
  secret: env.FEDERALIST_SESSION_SECRET || "keyboard-cat",
  proxy: true,
  resave: false,
  saveUninitialized: false,
}
