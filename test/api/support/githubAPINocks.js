const nock = require('nock');
const config = require('../../../config');

const getAccessToken = ({ authorizationCode, accessToken, scope } = {}) => {
  /* eslint-disable no-param-reassign */
  authorizationCode = authorizationCode || 'auth-code-123abc';
  accessToken = accessToken || 'access-token-123abc';

  if (scope && typeof scope !== 'string') {
    scope = scope.join(',');
  } else {
    scope = 'user,repo';
  }
  /* eslint-enable no-param-reassign */

  return nock('https://github.com')
    .post('/login/oauth/access_token', (body) => {
      const expectedBody = {
        client_id: config.passport.github.options.clientID,
        client_secret: config.passport.github.options.clientSecret,
        code: authorizationCode,
      };
      return body.client_id === expectedBody.client_id &&
        body.client_secret === expectedBody.client_secret &&
        body.code === expectedBody.code;
    })
    .reply(200, {
      token_type: 'bearer',
      scope,
      access_token: accessToken,
    });
};

const createRepoForOrg = ({ accessToken, org, repo, response } = {}) => {
  let createRepoNock = nock('https://api.github.com');

  if (org && repo) {
    createRepoNock = createRepoNock.post(`/orgs/${org}/repos`, {
      name: repo,
    });
  } else {
    createRepoNock = createRepoNock.post(/\/orgs\/.*\/repos/);
  }

  if (accessToken) {
    createRepoNock = createRepoNock.query({ access_token: accessToken });
  } else {
    createRepoNock = createRepoNock.query(true);
  }

  const typicalResponse = {
    owner: { login: org },
    name: repo,
  };

  let resp = response || 201;
  if (typeof resp === 'number') {
    resp = [resp, typicalResponse];
  } else if (resp[1] === undefined) {
    resp[1] = typicalResponse;
  }

  return createRepoNock.reply(...resp);
};

const createRepoForUser = ({ accessToken, repo, response } = {}) => {
  let createRepoNock = nock('https://api.github.com');

  if (repo) {
    createRepoNock = createRepoNock.post('/user/repos', {
      name: repo,
    });
  } else {
    createRepoNock = createRepoNock.post('/user/repos');
  }

  if (accessToken) {
    createRepoNock = createRepoNock.query({ access_token: accessToken });
  } else {
    createRepoNock = createRepoNock.query(true);
  }

  const typicalResponse = {
    owner: { login: 'your-name-here' },
    name: repo,
  };

  let resp = response || 201;
  if (typeof resp === 'number') {
    resp = [resp, typicalResponse];
  } else if (resp[1] === undefined) {
    resp[1] = typicalResponse;
  }

  return createRepoNock.reply(...resp);
};

const user = ({ accessToken, githubUserID, username, email } = {}) => {
  /* eslint-disable no-param-reassign */
  accessToken = accessToken || 'access-token-123abc';

  const userID = githubUserID || Math.floor(Math.random() * 10000);
  username = username || `user-${userID}`;
  email = email || `${username}@example.com`;
  /* eslint-enable no-param-reassign */

  return nock('https://api.github.com')
    .get(`/user?access_token=${accessToken}`)
    .reply(200, {
      email,
      login: username,
      id: githubUserID,
    });
};

const userOrganizations = ({ accessToken, organizations, response } = {}) => {
  /* eslint-disable no-param-reassign */
  accessToken = accessToken || 'access-token-123abc';
  organizations = organizations || [{ id: 123456 }];
  /* eslint-enable no-param-reassign */

  return nock('https://api.github.com')
    .get(`/user/orgs?access_token=${accessToken}`)
    .reply(response || 200, organizations);
};

const githubAuth = (username, organizations) => {
  getAccessToken();
  user({ username });
  userOrganizations({ organizations });
};

// eslint-disable-next-line no-shadow
const repo = ({ accessToken, owner, repo, response } = {}) => {
  let webhookNock = nock('https://api.github.com');

  if (owner && repo) {
    webhookNock = webhookNock.get(`/repos/${owner}/${repo}`);
  } else {
    webhookNock = webhookNock.get(/\/repos\/.*\/.*/);
  }

  if (accessToken) {
    webhookNock = webhookNock.query({ access_token: accessToken });
  } else {
    webhookNock = webhookNock.query(true);
  }

  const typicalResponse = {
    permissions: {
      admin: true,
      push: true,
      pull: true,
    },
  };

  let resp = response || 201;
  if (typeof resp === 'number') {
    resp = [resp, typicalResponse];
  } else if (resp[1] === undefined) {
    resp[1] = typicalResponse;
  }

  return webhookNock.reply(...resp);
};

// eslint-disable-next-line no-shadow
const status = ({ accessToken, owner, repo, sha, state, targetURL } = {}) => {
  let path;
  if (owner && repo && sha) {
    path = `/repos/${owner}/${repo}/statuses/${sha}`;
  } else {
    path = /\/repos\/.+\/.+\/statuses\/.+/;
  }

  let statusNock = nock('https://api.github.com').post(path, (body) => {
    if (state && body.state != state) { // eslint-disable-line eqeqeq
      return false;
    }
    if (targetURL && body.target_url !== targetURL) {
      return false;
    }

    const appEnv = process.env.APP_ENV;
    if (appEnv === 'production' && body.context !== 'federalist/build') {
      return false;
    } else if (appEnv !== 'production' && body.context !== `federalist-${process.env.APP_ENV}/build`) {
      return false;
    }

    return true;
  });

  if (accessToken) {
    statusNock = statusNock.query({ access_token: accessToken });
  } else {
    statusNock = statusNock.query(true);
  }

  return statusNock.reply(201, { id: 1 });
};

// eslint-disable-next-line no-shadow
const webhook = ({ accessToken, owner, repo, response } = {}) => {
  let webhookNock = nock('https://api.github.com');

  if (owner && repo) {
    webhookNock = webhookNock.post(`/repos/${owner}/${repo}/hooks`, {
      name: 'web',
      active: true,
      config: {
        url: config.webhook.endpoint,
        secret: config.webhook.secret,
        content_type: 'json',
      },
    });
  } else {
    webhookNock = webhookNock.post(/\/repos\/.*\/.*\/hooks/);
  }

  if (accessToken) {
    webhookNock = webhookNock.query({ access_token: accessToken });
  } else {
    webhookNock = webhookNock.query(true);
  }

  let resp = response || 201;
  if (typeof resp === 'number') {
    resp = [resp];
  }

  return webhookNock.reply(...resp);
};

module.exports = {
  getAccessToken,
  createRepoForOrg,
  createRepoForUser,
  githubAuth,
  repo,
  status,
  user,
  userOrganizations,
  webhook,
};
