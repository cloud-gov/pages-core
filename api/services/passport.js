const logger = require("winston")
const GitHub = require("./GitHub")
const GitHubStrategy = require('passport-github').Strategy
const passport = require('passport')
const config = require("../../config")
const { User } = require("../models")

const githubVerifyCallback = (accessToken, refreshToken, profile, callback) => {
  let user
  return GitHub.validateUser(accessToken).then(() => {
    return User.findOrCreate({
      where: { username: profile.username },
      defaults: {
        email: profile.emails[0].value,
        username: profile.username,
      },
    })
  }).then(models => {
    user = models[0]
    if (!user) throw new Error(`Unable to find or create user ${profile.username}`);
    return user.update({
      githubAccessToken: accessToken,
      githubUserId: profile.id,
      signedInAt: new Date(),
    })
  }).then(() => {
    callback(null, user)
  }).catch(err => {
    logger.warn("Authentication error: ", err)
    callback(err)
  })
}

passport.use(new GitHubStrategy(
  config.passport.github.options,
  githubVerifyCallback
))

passport.logout = (req, res) => {
  req.logout();
  req.session.authenticated = false;
  req.session.save(() => {
    res.redirect('/');
  })
}

passport.callback = (req, res) => {
  passport.authenticate("github")(req, res, () => {
    if (req.user) {
      req.session.authenticated = true
      req.session.save(() => {
        if (req.session.authRedirectPath) {
          res.redirect(req.session.authRedirectPath)
        } else {
          res.redirect("/")
        }
      })
    } else {
      res.redirect("/?login_failed=1")
    }
  })
}

passport.serializeUser((user, next) => {
  next(null, user.id);
})

passport.deserializeUser((id, next) => {
  User.findById(id).then(user => {
    next(null, user)
  })
})

module.exports = passport;
