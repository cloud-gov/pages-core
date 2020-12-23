const Passport = require('passport');
const config = require('../../config');
const { User } = require('../models');
const { createSSOStrategy } = require('../services/ssoStrategy');

const passport = new Passport.Passport();

const ssoOptions = config.passport.sso.adminOptions;

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

const ssoStrategy = createSSOStrategy(ssoOptions, verify);

passport.use('sso', ssoStrategy);

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
  res.redirect(ssoStrategy.logoutRedirectURL);
};

module.exports = passport;
