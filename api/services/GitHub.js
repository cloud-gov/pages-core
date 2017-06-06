const Github = require('github');
const config = require('../../config');
const { User } = require('../models');

const createRepoForOrg = (github, options) => new Promise((resolve, reject) => {
  github.repos.createFromOrg(options, (err, res) => {
    if (err) {
      reject(Object.assign(err, { status: err.code }));
    } else {
      resolve(res);
    }
  });
});

const createRepoForUser = (github, options) => new Promise((resolve, reject) => {
  github.repos.create(options, (err, res) => {
    if (err) {
      reject(Object.assign(err, { status: err.code }));
    } else {
      resolve(res);
    }
  });
});

const createWebhook = (github, options) => new Promise((resolve, reject) => {
  github.repos.createHook(options, (err, res) => {
    if (err) {
      reject(Object.assign(err, { status: err.code }));
    } else {
      resolve(res);
    }
  });
});

const getOrganizations = github => new Promise((resolve, reject) => {
  github.user.getOrgs({}, (err, organizations) => {
    if (err) {
      reject(Object.assign(err, { status: err.code }));
    } else {
      resolve(organizations);
    }
  });
});

const getRepository = (github, options) => new Promise((resolve, reject) => {
  github.repos.get(options, (err, repo) => {
    if (err) {
      reject(Object.assign(err, { status: err.code }));
    } else {
      resolve(repo);
    }
  });
});

const githubClient = accessToken => new Promise((resolve) => {
  const client = new Github({ version: '3.0.0' });
  client.authenticate({
    type: 'oauth',
    token: accessToken,
  });
  resolve(client);
});

const parseGithubErrorMessage = (error) => {
  let githubError = 'Encounted an unexpected GitHub error';

  try {
    githubError = JSON.parse(error.message).errors[0].message;
  } catch (e) {
    try {
      githubError = JSON.parse(error.message).message;
    } catch (e2) { /* noop */ }
  }

  return githubError;
};

const handleCreateRepoError = (err) => {
  const error = err;

  const REPO_EXISTS_MESSAGE = 'name already exists on this account';

  const githubError = parseGithubErrorMessage(error);

  if (githubError === REPO_EXISTS_MESSAGE) {
    error.status = 400;
    error.message = 'A repo with that name already exists.';
  } else if (githubError && error.code === 403) {
    error.status = 400;
    error.message = githubError;
  }

  throw error;
};

const handleWebhookError = (err) => {
  const error = err;

  const HOOK_EXISTS_MESSAGE = 'Hook already exists on this repository';
  const NO_ACCESS_MESSAGE = 'Not Found';
  const NO_ADMIN_ACCESS_ERROR_MESSAGE = 'You do not have admin access to this repository';

  const githubError = parseGithubErrorMessage(error);

  if (githubError === HOOK_EXISTS_MESSAGE) {
    // noop
  } else if (githubError === NO_ACCESS_MESSAGE) {
    const adminAccessError = new Error(NO_ADMIN_ACCESS_ERROR_MESSAGE);
    adminAccessError.status = 400;
    throw adminAccessError;
  } else {
    throw error;
  }
};

module.exports = {
  checkPermissions: (user, owner, repository) =>
    githubClient(user.githubAccessToken)
      .then(github => getRepository(github, { user: owner, repo: repository }))
      .then(fetchedRepository => fetchedRepository.permissions),

  createRepo: (user, owner, repository) =>
    githubClient(user.githubAccessToken)
      .then((github) => {
        if (user.username.toLowerCase() === owner.toLowerCase()) {
          return createRepoForUser(github, {
            name: repository,
          });
        }

        return createRepoForOrg(github, {
          name: repository,
          org: owner,
        });
      })
      .catch(handleCreateRepoError),

  getRepository: (user, owner, repository) =>
    githubClient(user.githubAccessToken)
      .then(github => getRepository(github, {
        user: owner,
        repo: repository,
      }))
      .catch((err) => {
        if (err.status === 404) {
          return null;
        }
        throw err;
      }),

  setWebhook: (site, user) => {
    const userId = user.id || user;

    return User.findById(userId)
      .then((model) => {
        const fetchedFederalistUser = model;
        return githubClient(fetchedFederalistUser.githubAccessToken);
      })
      .then(github => createWebhook(github, {
        user: site.owner,
        repo: site.repository,
        name: 'web',
        active: true,
        config: {
          url: config.webhook.endpoint,
          secret: config.webhook.secret,
          content_type: 'json',
        },
      }))
      .catch(handleWebhookError);
  },

  validateUser: (accessToken) => {
    const approvedOrgs = config.passport.github.organizations || [];

    return githubClient(accessToken)
      .then(github => getOrganizations(github))
      .then((organizations) => {
        const approvedOrg = organizations.find(organization =>
          approvedOrgs.indexOf(organization.id) >= 0
        );

        if (!approvedOrg) {
          throw new Error('Unauthorized');
        }
      });
  },
};
