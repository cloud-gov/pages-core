const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const config = require('../../config');
const { User } = require('../models');

const passport = new Passport.Passport();

const options = config.passport.github.externalOptions;

const onSuccess = (accessToken, _refreshToken, _profile, callback) => {
  const username = _profile.username.toLowerCase();
  User.findOne({
    attributes: ['signedInAt'],
    where: {
      username,
    },
  })
    .then((user) => {
      if (!user) {
        throw new Error('Unauthorized');
      }

      if ((new Date() - user.signedInAt) > config.session.cookie.maxAge) {
        throw new Error('SessionExpired');
      }

      callback(null, { accessToken });
    })
    .catch((err) => {
      let { message } = err;
      if (message === 'Unauthorized') {
        message = [
          'Unauthorized:',
          'You must be an a cloud.gov Pages user with your GitHub account',
          'added to your cloud.gov Pages profile.',
        ].join(' ');
      } else if (message === 'SessionExpired') {
        message = [
          'Session Expired:',
          'It has been more than 24 hours since you have logged-in to cloud.gov Pages.',
          'Please login in to cloud.gov Pages and then try again.',
        ].join(' ');
      }

      callback(null, { message });
    });
};

passport.use(new GitHubStrategy(options, onSuccess));

module.exports = passport;
