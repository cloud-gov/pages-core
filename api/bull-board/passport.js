const passport = require('passport');
const config = require('./config');
const { User } = require('../models');
const { createUAAStrategy } = require('../services/uaaStrategy');
const UAAClient = require('./uaaClient');
const envConfig = require('../../config/env');

const uaaOptions = {
  ...config.passport.uaa.options,
  callbackURL: `${config.app.hostname}/auth/uaa/callback`,
  logoutCallbackURL: `${config.app.hostname}/auth/uaa/logout`,
};

async function verifyUAAUser(profile, uaaGroups) {

  const { user_id: uaaId } = profile;
  const client = new UAAClient();
  const isVerified = await client.verifyUserGroup(uaaId, uaaGroups);

  if (!isVerified) {
    return null;
  }

  return uaaId;
}

const verify = async (accessToken, refreshToken, profile, callback) => {
  try {
    const uuaId = await verifyUAAUser(profile, ['pages.admin']);

    if (!uuaId) return callback(null, false);

    return callback(null, { uuaId });
  } catch (err) {
    return callback(err);
  }
};

const uaaStrategy = createUAAStrategy(uaaOptions, verify);

passport.use('uaa', uaaStrategy);

passport.serializeUser(({ uuaId }, next) => {
  next(null, uuaId);
});

passport.deserializeUser((uuaId, next) => {
  next(null, { uuaId });
});

passport.logout = (req, res) => {
  req.logout();
  res.redirect(uaaStrategy.logoutRedirectURL);
};

module.exports = passport;
