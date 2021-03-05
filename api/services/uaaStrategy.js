const { Strategy } = require('passport-oauth2');
const UAAClient = require('../utils/uaaClient');
const { UAAIdentity } = require('../models');

function createUAAStrategy(options, verify) {
  const {
    logoutCallbackURL, logoutURL, userURL, ...rest
  } = options;

  const opts = { ...rest, scope: ['openid'] };

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

  strategy.logoutRedirectURL = `${logoutURL}?${params.toString()}`;

  return strategy;
}

async function verifyUAAUser(accessToken, refreshToken, uaaId, uaaGroup) {
  const client = new UAAClient(accessToken);
  const isVerified = await client.verifyUserGroup(uaaId, uaaGroup);

  if (!isVerified) {
    return null;
  }

  const identity = await UAAIdentity.findOne({ where: { uaaId } });

  if (!identity) {
    return null;
  }

  const user = await identity.getUser();

  if (!user) {
    return null;
  }

  identity.accessToken = accessToken;
  identity.refreshToken = refreshToken;
  await identity.save();

  return user;
}

module.exports = { createUAAStrategy, verifyUAAUser };
