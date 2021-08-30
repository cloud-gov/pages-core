const Passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('../../config');
const env = require('../../services/environment')();
const { User } = require('../models');
const { createUAAStrategy, verifyUAAUser } = require('../services/uaaStrategy');
const GitHub = require('../services/GitHub');

const passport = new Passport.Passport();

passport.serializeUser((user, next) => {
  next(null, user.id);
});

passport.deserializeUser((id, next) => {
  User.findByPk(id).then((user) => {
    next(null, user);
  });
});

/**
 * UAA Auth
 */
const uaaOptions = {
  ...config.passport.uaa.options,
  callbackURL: `${config.app.hostname}/admin/auth/uaa/callback`,
  logoutCallbackURL: `${config.app.hostname}/admin/auth/uaa/logout`,
};

const verify = async (accessToken, refreshToken, profile, callback) => {
  try {
    const user = await verifyUAAUser(accessToken, refreshToken, profile, ['pages.admin']);

    if (!user) return callback(null, false);

    return callback(null, user);
  } catch (err) {
    return callback(err);
  }
};

const uaaStrategy = createUAAStrategy(uaaOptions, verify);

passport.use('uaa', uaaStrategy);

passport.logout = (req, res) => {
  req.logout();
  res.redirect(uaaStrategy.logoutRedirectURL);
};

/**
 * Github Auth
 */
const githubOptions = config.passport.github.authorizationOptions;
githubOptions.callbackURL = `${env.APP_HOSTNAME}/admin/auth/github2/callback`;

async function verifyGithub(accessToken, _refreshToken, profile, callback) {
  const { id, username } = profile;

  try {
    await GitHub.ensureFederalistAdmin(accessToken, username.toLowerCase());

    const user = await User.findOne({ where: { githubUserId: id } });

    return callback(null, user);
  } catch (err) {
    return callback(err);
  }
}

passport.use('github', new GitHubStrategy(githubOptions, verifyGithub));

module.exports = passport;
