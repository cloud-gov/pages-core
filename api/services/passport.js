const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const config = require('../../config');
const { logger } = require('../../winston');
const { User, Event } = require('../models');
const GitHub = require('./GitHub');
const RepositoryVerifier = require('./RepositoryVerifier');
const EventCreator = require('./EventCreator');
const { createUAAStrategy, verifyUAAUser } = require('./uaaStrategy');

const passport = new Passport.Passport();

const {
  github: {
    options: githubOptions,
    authorizationOptions: githubAuthorizationOptions,
  },
} = config.passport;

const uaaOptions = {
  ...config.passport.uaa.options,
  callbackURL: `${config.app.hostname}/auth/uaa/callback`,
  logoutCallbackURL: `${config.app.hostname}/auth/uaa/logout`,
};

async function verifyGithub(accessToken, _refreshToken, profile, callback) {
  try {
    const isValidUser = await GitHub.validateUser(accessToken, false);
    if (!isValidUser) {
      return callback(null, false);
    }

    const username = profile.username.toLowerCase();
    // eslint-disable-next-line no-underscore-dangle
    const { email } = profile._json;

    const [user] = await User.upsert({
      username,
      email,
      githubAccessToken: accessToken,
      githubUserId: profile.id,
      signedInAt: new Date(),
    });

    EventCreator.audit(Event.labels.AUTHENTICATION, user, 'GitHub login');

    RepositoryVerifier.verifyUserRepos(user)
      .catch(err => EventCreator.error(Event.labels.SITE_USER, err, {
        userId: user.id,
      }));

    return callback(null, user);
  } catch (err) {
    logger.warn('Authentication error: ', err);
    return callback(err);
  }
}

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

    return callback(null, user);
  } catch (err) {
    logger.warn('Github authentication error: ', err);
    return callback(err);
  }
}

async function verifyUAA(accessToken, refreshToken, profile, callback) {
  try {
    const user = await verifyUAAUser(
      accessToken,
      refreshToken,
      profile,
      ['pages.user', 'pages.admin']
    );

    if (!user) return callback(null, false);

    await user.update({
      signedInAt: new Date(),
    });

    EventCreator.audit(Event.labels.AUTHENTICATION, user, 'UAA login');

    return callback(null, user);
  } catch (err) {
    return callback(err);
  }
}

const uaaStrategy = createUAAStrategy(uaaOptions, verifyUAA);

passport.use('github', new GitHubStrategy(githubOptions, verifyGithub));
passport.use('github2', new GitHubStrategy(githubAuthorizationOptions, verifyGithub2));
passport.use('uaa', uaaStrategy);

passport.logout = (idp) => {
  const redirectURL = idp === 'uaa' ? uaaStrategy.logoutRedirectURL : '/';
  return (req, res) => {
    const { user } = req;
    req.logout();
    if (user) {
      EventCreator.audit(Event.labels.AUTHENTICATION, user, 'logout');
    }
    req.session.destroy(() => {
      res.redirect(redirectURL);
    });
  };
};

passport.serializeUser((user, next) => {
  next(null, user.id);
});

passport.deserializeUser((id, next) => {
  User.findByPk(id).then((user) => {
    next(null, user);
  });
});

module.exports = passport;
