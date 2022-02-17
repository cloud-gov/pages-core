const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const { Strategy } = require('passport-oauth2');
const config = require('./config');
const UAAClient = require('./uaaClient');
const GitHubClient = require('./githubClient');

passport.serializeUser(({ id }, next) => {
  next(null, id);
});

passport.deserializeUser((id, next) => {
  next(null, { id });
});

/**
 * Github Auth
 */
const githubOptions = config.github;

async function verifyGithub(accessToken, _refreshToken, profile, callback) {
  const { id, username } = profile;

  try {
    const githubClient = new GitHubClient(accessToken);
    await githubClient.ensureFederalistAdmin(username.toLowerCase());

    return callback(null, { id });
  } catch (err) {
    return callback(err);
  }
}

passport.use('github', new GitHubStrategy(githubOptions, verifyGithub));

let uaaLogoutRedirectURL = '';

if (config.product === 'pages') {
  const uaaOptions = config.uaa;

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
      const uuaId = await verifyUAAUser(profile, ['pages.admin']);

      if (!uuaId) return callback(null, false);

      return callback(null, { id: uuaId });
    } catch (err) {
      return callback(err);
    }
  };

  const uaaStrategy = createUAAStrategy(uaaOptions, verify);

  passport.use('uaa', uaaStrategy);

  uaaLogoutRedirectURL = uaaStrategy.logoutRedirectURL;
}

passport.logout = (idp) => {
  const redirectURL = idp === 'uaa' ? uaaLogoutRedirectURL : '/';
  return (req, res) => {
    req.logout();
    res.redirect(redirectURL);
  };
};

module.exports = passport;
