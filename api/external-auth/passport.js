const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const inflection = require('inflection');
const config = require('../../config');
const { User } = require('../models');

const passport = new Passport.Passport();

const options = config.passport.github.externalOptions;

const onSuccess = (accessToken, _refreshToken, _profile, callback) => {
  const username = _profile.username.toLowerCase();
  const { maxAge } = config.session.cookie;
  const isExpired = (date, timeLimit) => (new Date() - date) > timeLimit;

  User.findOne({
    attributes: ['signedInAt'],
    where: {
      username,
    },
  })
    .then((user) => {
      const productTitle = inflection.titleize(config.app.product);

      if (!user) {
        throw new Error(`You must be a ${productTitle} user with a connected GitHub account.`);
      }

      if (!user.signedInAt || isExpired(user.signedInAt, maxAge)) {
        const maxAgeHours = Math.ceil(maxAge / (1000 * 60 * 60));
        throw new Error(`You have not logged-in to ${productTitle} within the past ${maxAgeHours} hours. Please log in to ${productTitle} and try again.`);
      }

      callback(null, { accessToken });
    })
    .catch(callback);
};

passport.use(new GitHubStrategy(options, onSuccess));

module.exports = passport;
