const Passport = require('passport');
const config = require('../../config');
const { User, Event } = require('../models');
const { createUAAStrategy, verifyUAAUser } = require('../services/uaaStrategy');
const EventCreator = require('../services/EventCreator');

const passport = new Passport.Passport();

passport.serializeUser((user, next) => {
  next(null, {
    id: user.id,
    role: user.role,
  });
});

passport.deserializeUser(({ id }, next) => {
  User.findByPk(id).then((user) => {
    next(null, user);
  });
});

/**
 * UAA Auth
 */
const uaaOptions = {
  ...config.passport.uaa.options,
  callbackURL: `${config.app.hostname}/admin/auth/uaa/callback`,
  logoutCallbackURL: `${config.app.hostname}/admin/auth/uaa/logout`,
  passReqToCallback: true,
};

const verify = async (req, accessToken, refreshToken, profile, callback) => {
  try {
    const { user, role } = await verifyUAAUser(accessToken, refreshToken, profile);

    if (user && role) {
      return callback(null, {
        ...user.dataValues,
        role,
      });
    }

    return callback(null, false);
  } catch (err) {
    return callback(err);
  }
};

const uaaStrategy = createUAAStrategy(uaaOptions, verify);

passport.use('uaa', uaaStrategy);

passport.logout = (req, res) => {
  const { user } = req;
  req.logout((logoutError) => {
    if (logoutError) {
      EventCreator.error(Event.labels.AUTHENTICATION_ADMIN, logoutError, {
        user,
      });
      return res.redirect(config.app.hostname);
    }

    if (user) {
      EventCreator.audit(Event.labels.AUTHENTICATION_ADMIN, user, 'logout');
    }

    return res.redirect(uaaStrategy.logoutRedirectURL);
  });
};

module.exports = passport;
