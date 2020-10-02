const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const config = require('../../config');
const { User, Event } = require('../models');
const { logger } = require('../../winston');
const GitHub = require('./GitHub');
const RepositoryVerifier = require('./RepositoryVerifier');
const EventCreator = require('./EventCreator');

const passport = new Passport.Passport();

const githubVerifyCallback = (accessToken, refreshToken, profile, callback) => {
  let user;

  return GitHub.validateUser(accessToken)
    .then(() => User.findOrCreate({
      where: { username: profile.username.toLowerCase() },
      defaults: {
        // eslint-disable-next-line no-underscore-dangle
        email: profile._json.email,
        username: profile.username,
        isActive: true,
      },
    }))
    .then((models) => {
      [user] = models;
      if (!user) {
        throw new Error(`Unable to find or create user ${profile.username}`);
      }
      const eventBody = { action: 'login' };
      EventCreator.audit(Event.labels.AUTHENTICATION, user, eventBody);

      return user.update({
        githubAccessToken: accessToken,
        githubUserId: profile.id,
        signedInAt: new Date(),
      });
    })
    .then(() => {
      RepositoryVerifier.verifyUserRepos(user); // verify user's site's repos
      callback(null, user);
    })
    .catch((err) => {
      logger.warn('Authentication error: ', err);
      callback(err);
    });
};

passport.use(new GitHubStrategy(config.passport.github.options, githubVerifyCallback));

passport.logout = (req, res) => {
  const { user } = req;
  req.logout();
  if (user) {
    const eventBody = { action: 'logout' };
    EventCreator.audit(Event.labels.AUTHENTICATION, user, eventBody);
  }
  req.session.destroy(() => {
    res.redirect(config.app.homepageUrl);
  });
};

passport.callback = (req, res) => {
  passport.authenticate('github')(req, res, () => {
    if (req.user) {
      req.session.authenticated = true;
      req.session.authenticatedAt = new Date();
      req.session.save(() => {
        if (req.session.authRedirectPath) {
          res.redirect(req.session.authRedirectPath);
        } else {
          res.redirect('/');
        }
      });
    } else {
      req.flash('error', {
        title: 'Unauthorized',
        message: 'Apologies; you don\'t have access to Federalist! '
                 + 'Please contact the Federalist team if this is in error.',
      });
      res.redirect('/');
    }
  });
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
