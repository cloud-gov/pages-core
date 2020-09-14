const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');

const config = require('../../config');
const GitHub = require('../services/GitHub');

const passport = new Passport.Passport();

const options = config.passport.github.externalOptions;

const onSuccess = (accessToken, _refreshToken, _profile, callback) => {
  GitHub.validateUser(accessToken)
    .then(() => callback(null, { accessToken }))
    .catch((err) => {
      if (err.message === 'Unauthorized') {
        callback(null, false);
      } else {
        callback(err);
      }
    });
};

passport.use(new GitHubStrategy(options, onSuccess));

module.exports = passport;
