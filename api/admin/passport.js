const Passport = require('passport');
const config = require('../../config');
const { User } = require('../models');
const uaaStrategy = require('./uaaStrategy');

const passport = new Passport.Passport();

const uaaOptions = config.passport.uaa.options;

const verify = async (accessToken, _refreshToken, profile, callback) => {
  const { email } = profile;

  try {
    const user = await User.findOne({ where: { adminEmail: email } });

    if (!user) {
      return callback(null, false);
    }

    return callback(null, user);
  } catch (err) {
    return callback(err);
  }
};

passport.use('uaa', uaaStrategy(uaaOptions, verify));

passport.serializeUser((user, next) => {
  next(null, user.id);
});

passport.deserializeUser((id, next) => {
  User.findByPk(id).then((user) => {
    next(null, user);
  });
});

passport.logout = (req, res) => {
  req.logout();
  const params = new URLSearchParams();
  params.set('redirect', uaaOptions.logoutCallbackURL);
  params.set('client_id', uaaOptions.clientID);
  res.redirect(`${uaaOptions.logoutURL}?${params.toString()}`);
};

module.exports = passport;
