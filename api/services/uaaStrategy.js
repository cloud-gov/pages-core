const { Strategy, TokenError } = require('passport-oauth2');
const { Sequelize } = require('sequelize');
const UAAClient = require('../utils/uaaClient');
const { Event, UAAIdentity, User } = require('../models');
const EventCreator = require('./EventCreator');

function createUAAStrategy(options, verify) {
  const { logoutCallbackURL, logoutURL, userURL, ...rest } = options;

  const opts = rest;

  const strategy = new Strategy(opts, verify);

  strategy.userProfile = (accessToken, callback) => {
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

  strategy.parseErrorResponse = function (body) {
    var json = JSON.parse(body);
    if (json.error) {
      return new TokenError(json.error_description, json.error, json.error_uri, 403);
    }
    return null;
  };

  const params = new URLSearchParams();
  params.set('redirect', logoutCallbackURL);
  params.set('client_id', opts.clientID);

  strategy.logoutRedirectURL = `${logoutURL}?${params}`;

  return strategy;
}

async function verifyUAAUser(accessToken, refreshToken, profile) {
  const { user_id: uaaId, email } = profile;
  const client = new UAAClient();

  const clientToken = await client.fetchClientToken();
  const { groups, origin, verified } = await client.fetchUser(uaaId, clientToken);
  const userGroups = groups.map((g) => g.display).filter((g) => g.startsWith('pages'));

  // the profile isn't verified if:
  // unverified and cloud.gov origin OR
  // no pages group membership
  if ((origin === 'cloud.gov' && !verified) || !userGroups.length) {
    EventCreator.audit(
      Event.labels.AUTHENTICATION,
      null,
      'UAA profile cannot be verified,',
      {
        profile,
      },
    );

    return { user: null, role: null };
  }

  const identity = await UAAIdentity.findOne({
    where: {
      email: {
        [Sequelize.Op.iLike]: email,
      },
    },
    include: User,
  });

  if (!identity) {
    EventCreator.audit(
      Event.labels.AUTHENTICATION,
      null,
      'UAA Identity cannot be found with email.',
      {
        profile,
      },
    );
    return { user: null, role: null };
  }

  if (!identity.User) {
    EventCreator.audit(
      Event.labels.AUTHENTICATION,
      null,
      'User cannot be associated to UAA Identity',
      {
        profile,
        identity,
      },
    );
    return { user: null, role: null };
  }

  await identity.update({
    uaaId,
    accessToken,
    refreshToken,
  });

  // add role based on highest permissioned user group
  const ordereredRoles = ['pages.admin', 'pages.support', 'pages.user'];
  const role = ordereredRoles.find((or) => userGroups.includes(or));

  return { user: identity.User, role };
}

module.exports = {
  createUAAStrategy,
  verifyUAAUser,
};
