const env = require("../services/environment")()

module.exports = {
  cookie: {
    secure: true,
    httpOnly: true,
    secure: true,
  },
  key: "federalist.sid",
  secret: env.FEDERALIST_SESSION_SECRET || "keyboard-cat",
  proxy: true,
  resave: true,
  saveUninitialized: true,
}
