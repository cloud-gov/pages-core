var GitHubStrategy = require('passport-github').Strategy
var passport = require('passport')

var githubVerifyCallback = (accessToken, refreshToken, profile, callback) => {
  var user
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
      githubUserId: profile.id
    })
  }).then(() => {
    callback(null, user)
  }).catch(err => {
    sails.log.info("Authentication error: ", err)
    callback(err)
  })
}

passport.use(new GitHubStrategy(
  sails.config.passport.github.options,
  githubVerifyCallback
))

passport.logout = (req, res) => {
  req.logout();
  req.session.authenticated = false;
  res.redirect('/');
}

passport.callback = (req, res) => {
  passport.authenticate("github")(req, res, () => {
    if (req.user) {
      req.session.authenticated = true
      res.redirect("/")
    } else {
      res.send(401, "Unauthorized")
    }
  })
}

passport.serializeUser((user, next) => {
  next(null, user.id);
})

passport.deserializeUser((id, next) => {
  User.findById(id).then(next)
})

module.exports = passport;
