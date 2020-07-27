const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');

const config = require('../../config');
const GitHub = require('../services/GitHub');

const passport = new Passport.Passport();

const options = config.passport.github.externalOptions;

const callback = (accessToken, _refreshToken, _profile, cb) => {
  GitHub.validateUser(accessToken)
    .then(() => cb(null, { accessToken }))
    .catch((err) => {
      if (err.message === 'Unauthorized') {
        cb(null, false);
      } else {
        cb(err);
      }
    });
};

passport.use(new GitHubStrategy(options, callback));

module.exports = passport;
