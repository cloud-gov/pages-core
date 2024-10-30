const jwt = require('jsonwebtoken');
const nock = require('nock');

const mockTokenRequest = (token) => {
  const accessToken =
    token ||
    jwt.sign(
      {
        exp: Date.now() / 1000 + 600,
      },
      '123abc',
    );

  const n = nock('https://login.example.com', {
    reqheaders: {
      authorization: `Basic ${Buffer.from('cf:').toString('Base64')}`,
    },
  })
    .persist()
    .post('/oauth/token', {
      grant_type: 'password',
      username: 'deploy_user',
      password: 'deploy_pass',
      response_type: 'token',
    });

  if (token === 'badtoken') {
    return n.reply(401);
  }

  if (token === 'emptytoken') {
    return n.reply(200, {});
  }

  return n.reply(200, {
    access_token: accessToken,
  });
};

module.exports = mockTokenRequest;
