const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const config = require('../../config');

const passport = new Passport.Passport();
const options = config.passport.github.externalOptions;

const onSuccess = async (accessToken, _refreshToken, _profile, callback) => {
  callback(null, { accessToken });
};

passport.use(new GitHubStrategy(options, onSuccess));

module.exports = passport;
