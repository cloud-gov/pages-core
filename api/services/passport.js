var GitHubStrategy = require('passport-github').Strategy
var passport = require('passport')

var githubVerifyCallback = (accessToken, refreshToken, profile, callback) => {
  var user

  return GitHub.validateUser(accessToken).then(() => {
    return User.findOrCreate({ username: profile.username }, {
      email: profile.emails[0].value,
      username: profile.username,
    })
  }).then(model => {
    user = model
    if (!user) throw new Error(`Unable to find or create user ${profile.username}`)
    return Passport.findOne({ user: user.id, provider: "github" })
  }).then(passport => {
    if (passport && passport.tokens && passport.tokens.accessToken === accessToken) {
      return passport
    } else if (passport) {
      return Passport.update(passport.id, {
        tokens: { accessToken: accessToken }
      })
    } else {
      return Passport.create({
        protocol: "oauth2",
        provider: "github",
        identifier: profile.id,
        tokens: { accessToken: accessToken },
        user: user
      })
    }
  }).then(passport => {
    callback(null, user)
  }).catch(err => {
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
  User.findOne(id, next);
})

module.exports = passport;
