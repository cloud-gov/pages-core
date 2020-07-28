const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');

const config = require('../../config');
const { User } = require('../models');
const FederalistUsersHelper = require('../services/FederalistUsersHelper');
const GitHub = require('../services/GitHub');

const passport = new Passport.Passport();

const options = config.passport.github.adminOptions;
const auditorUsername = config.federalistUsers.admin;

const onSuccess = async (accessToken, _refreshToken, profile, callback) => {
  const { _json: { email }, username } = profile;
  try {
    await GitHub.validateUser(accessToken);
    const admins = await FederalistUsersHelper.federalistUsersAdmins(auditorUsername);
    if (!admins.includes(username)) {
      throw new Error('Unauthorized');
    }

    const user = (await User.findOrCreate({
      where: { username: username.toLowerCase() },
      defaults: { email, username },
    }))[0];

    if (!user) {
      throw new Error(`Unable to find admin user ${username}`);
    }

    callback(null, user);
  } catch (err) {
    if (err.message === 'Unauthorized') {
      callback(null, false);
    } else {
      callback(err);
    }
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
