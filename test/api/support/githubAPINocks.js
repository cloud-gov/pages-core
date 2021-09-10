const nock = require('nock');
const config = require('../../../config');

const withAuth = (nok, accessToken) => nok.matchHeader('authorization', `token ${accessToken}`);

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
      return body.client_id === expectedBody.client_id
        && body.client_secret === expectedBody.client_secret
        && body.code === expectedBody.code;
    })
    .reply(200, {
      token_type: 'bearer',
      scope,
      access_token: accessToken,
    });
};

const createRepoForOrg = ({
  accessToken, org, repo, response,
} = {}) => {
  let createRepoNock = nock('https://api.github.com');

  if (org && repo) {
    createRepoNock = createRepoNock.post(`/orgs/${org}/repos`, {
      name: repo,
    });
  } else {
    createRepoNock = createRepoNock.post(/\/orgs\/.*\/repos/);
  }

  if (accessToken) {
    createRepoNock = withAuth(createRepoNock, accessToken);
  }

  createRepoNock = createRepoNock.query(true);

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
    createRepoNock = withAuth(createRepoNock, accessToken);
  }

  createRepoNock = createRepoNock.query(true);

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

const createRepoUsingTemplate = ({
  accessToken, repo, owner, template, response,
} = {}) => {
  let createRepoNock = nock('https://api.github.com');

  if (repo && template) {
    const params = {
      name: repo,
    };

    if (owner) {
      params.owner = owner;
    }

    createRepoNock = createRepoNock.post(`/repos/${template.owner}/${template.repo}/generate`, params);
  } else {
    createRepoNock = createRepoNock.post(/\/repos\/.+\/.+\/generate/);
  }

  if (accessToken) {
    createRepoNock = withAuth(createRepoNock, accessToken);
  }

  createRepoNock = createRepoNock.query(true);

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

const user = ({
  accessToken, githubUserID, username, email,
} = {}) => {
  /* eslint-disable no-param-reassign */
  accessToken = accessToken || 'access-token-123abc';

  const userID = githubUserID || Math.floor(Math.random() * 10000);
  username = (username || `user-${userID}`).toUpperCase();
  email = email || `${username}@example.com`.toLowerCase();
  /* eslint-enable no-param-reassign */

  const expectedHeaders = {
    reqheaders: { authorization: `Bearer ${accessToken}` },
  };

  return nock('https://api.github.com', expectedHeaders)
    .get('/user')
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

  let orgsNock = nock('https://api.github.com');

  if (accessToken) {
    orgsNock = withAuth(orgsNock, accessToken);
  }

  return orgsNock.get('/user/orgs')
    .reply(response || 200, organizations);
};

const githubAuth = (username, organizations) => {
  getAccessToken();
  user({ username });
  userOrganizations({ organizations });
};

const repo = ({
  // eslint-disable-next-line no-shadow
  accessToken, owner, repo, username, defaultBranch, response,
} = {}) => {
  let webhookNock = nock('https://api.github.com');

  if (owner && repo) {
    webhookNock = webhookNock.get(`/repos/${owner}/${repo}`);
  } else {
    webhookNock = webhookNock.get(/\/repos\/.*\/.*/);
  }

  if (accessToken) {
    webhookNock = withAuth(webhookNock, accessToken);
  }

  if (username) {
    webhookNock = webhookNock.query({ username });
  } else {
    webhookNock = webhookNock.query(true);
  }

  const typicalResponse = {
    default_branch: defaultBranch || 'main',
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

const status = ({
  // eslint-disable-next-line no-shadow
  accessToken, owner, repo, sha, state, targetURL, response,
} = {}) => {
  let path;
  if (owner && repo && sha) {
    path = `/repos/${owner}/${repo}/statuses/${sha}`;
  } else {
    path = /\/repos\/.+\/.+\/statuses\/.+/;
  }

  let statusNock = nock('https://api.github.com').post(path, (body) => {
    if (state && body.state != state) { return false; }// eslint-disable-line eqeqeq

    if (targetURL && body.target_url !== targetURL) { return false; }

    const appEnv = config.app.app_env;
    if (appEnv === 'production' && body.context !== 'federalist/build') {
      return false;
    } if (appEnv !== 'production' && body.context !== `federalist-${appEnv}/build`) {
      return false;
    }

    return true;
  });

  if (accessToken) {
    statusNock = withAuth(statusNock, accessToken);
  }

  statusNock = statusNock.query(true);

  const typicalResponse = { id: 1 };

  let resp = response || 201;
  if (typeof resp === 'number') {
    resp = [resp, typicalResponse];
  } else if (resp[1] === undefined) {
    resp[1] = typicalResponse;
  }

  return statusNock.reply(...resp);
};

const webhook = ({
  // eslint-disable-next-line no-shadow
  accessToken, owner, repo, response,
} = {}) => {
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
    webhookNock = withAuth(webhookNock, accessToken);
  }

  webhookNock = webhookNock.query(true);

  let resp = response || 201;
  if (typeof resp === 'number') {
    resp = [resp, { id: 1 }];
  }

  return webhookNock.reply(...resp);
};

function deleteWebhook({
  accessToken, owner, repo: repository, webhookId, response,
}) {
  return nock('https://api.github.com')
    .matchHeader('authorization', `token ${accessToken}`)
    .delete(`/repos/${owner}/${repository}/hooks/${webhookId}`)
    .reply(...response);
}

function listWebhooks({
  accessToken, owner, repo: repository, response,
}) {
  return nock('https://api.github.com')
    .matchHeader('authorization', `token ${accessToken}`)
    .get(`/repos/${owner}/${repository}/hooks`)
    .reply(...response);
}

const getBranch = ({
  // eslint-disable-next-line no-shadow
  accessToken, owner, repo, branch, expected,
}) => {
  let branchNock = nock('https://api.github.com');
  const path = `/repos/${owner}/${repo}/branches/${branch}`;

  branchNock = branchNock.get(path);

  if (accessToken) {
    branchNock = withAuth(branchNock, accessToken);
  }

  branchNock = branchNock.query(true);

  const output = expected || {
    name: 'main',
    commit: {
      sha: 'a172b66c31e19d456a448041a5b3c2a70c32d8b7',
    },
  };

  return branchNock.reply(200, output);
};

/* eslint-disable camelcase */
const getOrganizationMembers = ({
  accessToken, organization, role, per_page, page, response, responseCode,
}) => {
  /* eslint-disable no-param-reassign */
  accessToken = accessToken || 'access-token-123abc';
  organization = organization || 'test-org';
  per_page = per_page || 100;
  page = page || 1;
  role = role || 'all';
  /* eslint-enable no-param-reassign */

  const orgMembers = [];
  for (let i = 0; i < (per_page + 1); i += 1) {
    if ((i % 50) === 0) {
      if (role !== 'member') {
        orgMembers.push({ login: `admin-${organization}-${i}` });
      }
    } else if (role !== 'admin') {
      orgMembers.push({ login: `user-${organization}-${i}` });
    }
  }

  return withAuth(nock('https://api.github.com'), accessToken)
    .get(`/orgs/${organization}/members?per_page=${per_page}&page=${page}&role=${role}`)
    .reply(
      responseCode || 200,
      response || orgMembers.slice(((page - 1) * per_page), (page * per_page))
    );
};

const getTeamMembers = ({
  accessToken, org, team_slug, per_page, page, response,
} = {}) => {
  /* eslint-disable no-param-reassign */
  accessToken = accessToken || 'access-token-123abc';
  team_slug = team_slug || 'test-team';
  per_page = per_page || 100;
  page = page || 1;
  /* eslint-enable no-param-reassign */

  const teamMembers = [];
  for (let i = 0; i < (per_page + 2); i += 1) {
    teamMembers.push({ login: `user-${team_slug}-${i}` });
  }

  return withAuth(nock('https://api.github.com'), accessToken)
    .get(`/orgs/${org}/teams/${team_slug}/members?per_page=${per_page}&page=${page}`)
    .reply(response || 200, teamMembers.slice(((page - 1) * per_page), page * per_page));
};

const getRepositories = ({
  accessToken, per_page, page, response,
}) => {
  /* eslint-disable no-param-reassign */
  accessToken = accessToken || 'access-token-123abc';
  per_page = per_page || 100;
  page = page || 1;
  /* eslint-enable no-param-reassign */

  const repos = [];
  for (let i = 0; i < (per_page + 1); i += 1) {
    repos.push({
      full_name: `owner/repo-${i}`,
      default_branch: 'main',
      permissions: { push: true },
    });
  }

  return withAuth(nock('https://api.github.com'), accessToken)
    .get(`/user/repos?per_page=${per_page}&page=${page}`)
    .reply(response || 200, repos.slice(((page - 1) * per_page), (page * per_page)));
};

const getCollaborators = ({
  accessToken, owner, repository, per_page, page, response,
}) => {
  /* eslint-disable no-param-reassign */
  accessToken = accessToken || 'access-token-123abc';
  per_page = per_page || 100;
  page = page || 1;
  owner = owner || 'owner';
  repository = repository || 'repo';
  /* eslint-enable no-param-reassign */

  const collabs = [];
  for (let i = 0; i < (per_page + 1); i += 1) {
    collabs.push({ login: `collaborator-${i}`, permissions: { push: true } });
  }

  return withAuth(nock('https://api.github.com'), accessToken)
    .get(`/repos/${owner}/${repository}/collaborators?per_page=${per_page}&page=${page}`)
    .reply(response || 200, collabs.slice(((page - 1) * per_page), (page * per_page)));
};
/* eslint-enable camelcase */

const getMembershipForUserInOrg = ({
  accessToken = 'access-token-123abc',
  username = 'some-user',
  state,
}) => {
  const nok = withAuth(nock('https://api.github.com'), accessToken)
    .get(`/orgs/18f/teams/federalist-admins/memberships/${username}`);

  switch (state) {
    case 'pending':
      nok.reply(200, { state: 'pending', role: 'member' });
      break;
    case 'maintainer':
      nok.reply(200, { state: 'active', role: 'maintainer' });
      break;
    case 'unknown':
      nok.reply(404);
      break;
    default:
      nok.reply(200, { state: 'active', role: 'member' });
  }
  return nok;
};

const getContent = ({
  accessToken, owner, repo, path, ref, content, encoding, type, responseCode,
}) => {
  /* eslint-disable no-param-reassign */
  accessToken = accessToken || 'access-token-123abc';
  responseCode = responseCode || 200;
  /* eslint-enable no-param-reassign */
  let requestPath = `/repos/${owner}/${repo}/contents/${path}`;
  if (ref) {
    requestPath = `${requestPath}?ref=${ref}`;
  }
  const nok = withAuth(nock('https://api.github.com'), accessToken)
    .get(requestPath);

  if (responseCode >= 400) {
    nok.reply(responseCode, { message: 'Error Encountered'});
  } else if (Array.isArray(content)) {
      nok.reply(responseCode, content);  
  } else {
    const response = {};
    response.encoding = encoding || 'base64';
    response.type = type || 'file';
    response.content = Buffer.from(content || 'blah').toString(response.encoding);
    nok.reply(responseCode, response);
  }
  return nok;
};

module.exports = {
  getAccessToken,
  createRepoForOrg,
  createRepoForUser,
  createRepoUsingTemplate,
  githubAuth,
  repo,
  status,
  user,
  userOrganizations,
  webhook,
  deleteWebhook,
  listWebhooks,
  getBranch,
  getTeamMembers,
  getOrganizationMembers,
  getRepositories,
  getCollaborators,
  getMembershipForUserInOrg,
  getContent,
};
