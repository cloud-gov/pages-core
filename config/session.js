const env = require("../services/environment")()

module.exports = {
  cookie: {
    httpOnly: true,
    secure: false,
  },
  key: "federalist.sid",
  secret: env.FEDERALIST_SESSION_SECRET || "keyboard-cat",
  proxy: true,
  resave: true,
  saveUninitialized: true,
}
