const { Strategy } = require('passport-oauth2');
const UAAClient = require('../utils/uaaClient');
const { Event, UAAIdentity, User } = require('../models');
const EventCreator = require('./EventCreator');

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

async function verifyUAAUser(accessToken, refreshToken, profile, uaaGroups) {
  const { user_id: uaaId, email: casedEmail } = profile;
  // the UAA provided email maintains case but the database records do not
  const email = casedEmail.toLowerCase();

  const client = new UAAClient();
  const isVerified = await client.verifyUserGroup(uaaId, uaaGroups);

  if (!isVerified) {
    EventCreator.audit(Event.labels.AUTHENTICATION, null, 'UAA profile cannot be verified,', {
      profile,
    });

    return null;
  }

  const identity = await UAAIdentity.findOne({ where: { email }, include: User });

  if (!identity) {
    EventCreator.audit(Event.labels.AUTHENTICATION, null, 'UAA Identity cannot be found with email.', {
      profile,
    });
    return null;
  }

  if (!identity.User) {
    EventCreator.audit(Event.labels.AUTHENTICATION, null, 'User cannot be associated to UAA Identity', {
      profile,
      identity,
    });
    return null;
  }

  await identity.update({ uaaId, accessToken, refreshToken });

  return identity.User;
}

module.exports = { createUAAStrategy, verifyUAAUser };
