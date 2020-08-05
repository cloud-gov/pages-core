const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');

const config = require('../../config');
const { User } = require('../models');
const GitHub = require('../services/GitHub');

const passport = new Passport.Passport();

const options = config.passport.github.adminOptions;

const onSuccess = async (accessToken, _refreshToken, profile, callback) => {
  const { _json: { email }, username } = profile;

  try {
    await GitHub.ensureFederalistAdmin(accessToken, username);
  } catch (_) {
    return callback(null, false);
  }

  try {
    const user = (await User.findOrCreate({
      where: { username: username.toLowerCase() },
      defaults: { email, username },
    }))[0];

    return callback(null, user);
  } catch (err) {
    return callback(err);
  }
};

passport.use(new GitHubStrategy(options, onSuccess));

passport.serializeUser((user, next) => {
  next(null, user.id);
});

passport.deserializeUser((id, next) => {
  User.findByPk(id).then((user) => {
    next(null, user);
  });
});

module.exports = passport;
