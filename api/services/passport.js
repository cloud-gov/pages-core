const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const config = require('../../config');
const { logger } = require('../../winston');
const { User, Event } = require('../models');
const EventCreator = require('./EventCreator');
const { createUAAStrategy, verifyUAAUser } = require('./uaaStrategy');

const passport = new Passport.Passport();
const flashMessage = {
  message: `Apologies; you are not authorized to access ${config.app.appName}! Please contact the ${config.app.appName} team if this is in error.`,
};

passport.serializeUser((user, next) => {
  next(null, user.id);
});

passport.deserializeUser((id, next) => {
  User.scope('withUAAIdentity')
    .findByPk(id)
    .then((user) => {
      next(null, user);
    });
});

/**
 * Github Auth
 */
const {
  github: { authorizationOptions: githubAuthorizationOptions },
} = config.passport;

async function verifyGithub2(accessToken, _refreshToken, profile, callback) {
  try {
    const username = profile.username.toLowerCase();
    // eslint-disable-next-line no-underscore-dangle
    const { email } = profile._json;

    const user = {
      username,
      email,
      githubAccessToken: accessToken,
      githubUserId: profile.id,
    };

    EventCreator.audit(
      Event.labels.AUTHENTICATION_PAGES_GH_TOKEN,
      null,
      'User authenticated',
      {
        user,
      }
    );

    return callback(null, user);
  } catch (err) {
    EventCreator.error(Event.labels.AUTHENTICATION_PAGES_GH_TOKEN, err);
    logger.warn('Github authentication error: ', err);
    return callback(err);
  }
}

passport.use(
  'github2',
  new GitHubStrategy(githubAuthorizationOptions, verifyGithub2)
);

let uaaLogoutRedirectURL = '';

/**
 * UAA Auth
 */

const uaaOptions = {
  ...config.passport.uaa.options,
  callbackURL: `${config.app.hostname}/auth/uaa/callback`,
  logoutCallbackURL: `${config.app.hostname}/auth/uaa/logout`,
};

const verifyUAA = async (accessToken, refreshToken, profile, callback) => {
  try {
    const user = await verifyUAAUser(accessToken, refreshToken, profile, [
      'pages.user',
      'pages.support',
      'pages.admin',
    ]);

    if (!user) return callback(null, false, flashMessage);

    await user.update({
      signedInAt: new Date(),
    });

    EventCreator.audit(Event.labels.AUTHENTICATION, user, 'UAA login');

    return callback(null, user);
  } catch (err) {
    EventCreator.error(Event.labels.AUTHENTICATION, err, { profile });
    return callback(err);
  }
};

const uaaStrategy = createUAAStrategy(uaaOptions, verifyUAA);

passport.use('uaa', uaaStrategy);

uaaLogoutRedirectURL = uaaStrategy.logoutRedirectURL;

passport.logout = () => (req, res) => {
  const { user } = req;

  req.logout((logoutError) => {
    if (logoutError) {
      EventCreator.error(Event.labels.AUTHENTICATION, logoutError, { user });
      return res.redirect(config.app.hostname);
    }

    if (user) {
      EventCreator.audit(Event.labels.AUTHENTICATION, user, 'logout');
    }

    return res.redirect(uaaLogoutRedirectURL);
  });
};

module.exports = passport;
