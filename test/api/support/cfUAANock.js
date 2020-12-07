const nock = require('nock');
const { options: uaaConfig } = require('../../../config').passport.uaa;

function userProfile(profile, accessToken) {
  const url = new URL(uaaConfig.userURL);
  return nock(url.origin)
    .get(url.pathname)
    .query({ access_token: accessToken })
    .reply(200, profile);
}

function exchangeToken(code, accessToken) {
  const url = new URL(uaaConfig.tokenURL);

  return nock(url.origin)
    .post(url.pathname, body => (
      body.code === code
      && body.grant_type === 'authorization_code'
      && body.client_id === uaaConfig.clientID
      && body.client_secret === uaaConfig.clientSecret
    ))
    .reply(200, {
      access_token: accessToken,
      refresh_token: 'def456',
      expires_in: 10,
    });
}

function uaaAuth(profile, code) {
  const accessToken = 'accessToken';
  exchangeToken(code, accessToken);
  userProfile(profile, accessToken);
}

module.exports = {
  uaaAuth,
};
