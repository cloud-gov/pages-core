const GitHub = require('./GitHub');
const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport').Passport;
const config = require('../../config');
const { User } = require('../models');
const { logger } = require('../../winston');
const SiteUserAuditor = require('./SiteUserAuditor');
const RepositoryVerifier = require('./RepositoryVerifier');

github = new Passport();
foobar = new Passport();

const githubVerifyCallback = (accessToken, refreshToken, profile, callback) => {
  let user;

  return GitHub.validateUser(accessToken)
    .then(() => User.findOrCreate({
      where: { username: profile.username.toLowerCase() },
      defaults: {
        email: profile._json.email,
        username: profile.username,
      },
    }))
    .then((models) => {
      user = models[0];
      if (!user) {
        throw new Error(`Unable to find or create user ${profile.username}`);
      }
      return user.update({
        githubAccessToken: accessToken,
        githubUserId: profile.id,
        signedInAt: new Date(),
      });
    })
    .then(() => {
      User.findOne({ where: { username: process.env.USER_AUDITOR } })
        .then(auditor => SiteUserAuditor.auditUser(user, auditor)); // audit user's sites post auth

      RepositoryVerifier.verifyUserRepos(user); // verify user's site's repos
      callback(null, user);
    })
    .catch((err) => {
      logger.warn('Authentication error: ', err);
      callback(err);
    });
};

github.use(new GitHubStrategy(config.passport.github.options, githubVerifyCallback));

github.logout = (req, res) => {
  req.logout();
  req.session.destroy(() => {
    res.redirect(config.app.homepageUrl);
  });
};

github.callback = (req, res) => {
  github.authenticate('github')(req, res, () => {
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
        message: 'Apologies; you don\'t have access to Federalist! ' +
                 'Please contact the Federalist team if this is in error.',
      });
      res.redirect('/');
    }
  });
};

github.serializeUser((user, next) => {
  next(null, user.id || {});
});

github.deserializeUser((id, next) => {
  if (typeof id === 'object') return next(null, {});
  User.findByPk(id).then((user) => {
    next(null, user);
  });
});

const foobarOptions = {
  ...config.passport.github.options,
  callbackURL: 'http://localhost:1337/auth/github/callback/external',
  scope: ['user', 'repo'],
}

const foobarCallback = (accessToken, _refreshToken, _profile, callback) => {
  callback(null, { accessToken })
}

foobar.use('foobar', new GitHubStrategy(foobarOptions, foobarCallback));

module.exports = {
  github,
  foobar
};
