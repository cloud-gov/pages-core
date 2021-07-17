const passport = require('passport');
const { Strategy } = require('passport-oauth2');
const config = require('./config');
const UAAClient = require('./uaaClient');

const uaaOptions = {
  ...config.passport.uaa.options,
  callbackURL: `${config.app.hostname}/auth/uaa/callback`,
  logoutCallbackURL: `${config.app.hostname}/auth/uaa/logout`,
};

function createUAAStrategy(options, verify) {
  const {
    logoutCallbackURL, logoutURL, userURL, ...rest
  } = options;

  const opts = rest;

  const strategy = new Strategy(opts, verify);

  strategy.userProfile = (accessToken, callback) => {
    // eslint-disable-next-line no-underscore-dangle
    strategy._oauth2.get(userURL, accessToken, (err, body) => {
      if (err) {
        return callback(err);
      }

      try {
        return callback(null, JSON.parse(body));
      } catch (e) {
        return callback(e);
      }
    });
  };

  const params = new URLSearchParams();
  params.set('redirect', logoutCallbackURL);
  params.set('client_id', opts.clientID);

  strategy.logoutRedirectURL = `${logoutURL}?${params}`;

  return strategy;
}

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
