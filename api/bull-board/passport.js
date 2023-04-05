const passport = require('passport');
const { Strategy } = require('passport-oauth2');
const config = require('./config');
const UAAClient = require('./uaaClient');

passport.serializeUser(({ id }, next) => {
  next(null, id);
});

passport.deserializeUser((id, next) => {
  next(null, { id });
});

/**
 * Github Auth
 */

const createUAAStrategy = (options, verify) => {
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
};

const uaaOptions = config.uaa;

const verifyUAAUser = async (profile, uaaGroups) => {
  const { user_id: uaaId } = profile;
  const client = new UAAClient();
  const isVerified = await client.verifyUserGroup(uaaId, uaaGroups);

  if (!isVerified) {
    return null;
  }

  return uaaId;
};

const verify = async (accessToken, refreshToken, profile, callback) => {
  try {
    const uaaId = await verifyUAAUser(profile, ['pages.admin', 'pages.support']);

    if (!uaaId) return callback(null, false);

    return callback(null, { id: uaaId });
  } catch (err) {
    return callback(err);
  }
};

const uaaStrategy = createUAAStrategy(uaaOptions, verify);

passport.use('uaa', uaaStrategy);

passport.logout = () => {
  const redirectURL = uaaStrategy.logoutRedirectURL;
  return (req, res) => {
    req.logout();
    res.redirect(redirectURL);
  };
};

module.exports = passport;
