const octokit = require('@octokit/rest');
const config = require('../../config');
const { User } = require('../models');

const createRepoForOrg = (github, options) =>
  github.repos.createForOrg(options);

const createRepoForUser = (github, options) =>
  github.repos.create(options);

const createWebhook = (github, options) =>
  github.repos.createHook(options);

const getOrganizations = github =>
  github.users.getOrgs({}).then(orgs => orgs.data);

const getRepository = (github, options) =>
  github.repos.get(options).then(repos => repos.data);

const getBranch = (github, { owner, repo, branch }) =>
  github.repos.getBranch({ owner, repo, branch }).then(branchInfo => branchInfo.data);

const githubClient = accessToken => new Promise((resolve) => {
  const client = octokit();
  client.authenticate({
    type: 'oauth',
    token: accessToken,
  });
  resolve(client);
});

const parseGithubErrorMessage = (error) => {
  let githubError = 'Encountered an unexpected GitHub error';

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

const sendCreateGithubStatusRequest = (github, options) =>
  github.repos.createStatus(options);

const getOrganizationMembers = (github, org, page = 1) =>
  github.orgs.listMembers({ org, per_page: 100, page }).then(orgs => Promise.resolve(orgs.data));

const getNextOrganizationMembers = (github, org, page = 1, allMembers = []) =>
  getOrganizationMembers(github, org, page)
    .then((members) => {
      if (members.length > 0) {
        allMembers = allMembers.concat(members);  // eslint-disable-line no-param-reassign
        return getNextOrganizationMembers(github, org, page + 1, allMembers);
      }
      return Promise.resolve(allMembers);
    });

/* eslint-disable camelcase */
const getTeamMembers = (github, team_id, page = 1) =>
  github.teams.listMembers({ team_id, per_page: 100, page }).then(teams => teams.data);

const getNextTeamMembers = (github, team_id, page = 1, allMembers = []) =>
  getTeamMembers(github, team_id, page)
    .then((members) => {
      if (members.length > 0) {
        allMembers = allMembers.concat(members);  // eslint-disable-line no-param-reassign
        return getNextTeamMembers(github, team_id, page + 1, allMembers);
      }
      return Promise.resolve(allMembers);
    });
/* eslint-enable camelcase */

const removeOrganizationMember = (github, org, username) =>
  github.orgs.removeMember({ org, username });

module.exports = {
  checkPermissions: (user, owner, repo) =>
    githubClient(user.githubAccessToken)
      .then(github => getRepository(github, { owner, repo, username: user.username }))
      .then(repository => repository.permissions),

  checkOrganizations: (user, orgName) =>
    githubClient(user.githubAccessToken)
    .then(github => getOrganizations(github))
    .then(orgs => orgs.some(org => org.login.toLowerCase() === orgName)),

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

  getRepository: (user, owner, repo) =>
    githubClient(user.githubAccessToken)
      .then(github => getRepository(github, { owner, repo }))
      .catch((err) => {
        if (err.status === 404) {
          return null;
        }
        throw err;
      }),

  getBranch: (user, owner, repo, branch) =>
    githubClient(user.githubAccessToken)
    .then(github => getBranch(github, { owner, repo, branch }))
    .catch((err) => {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }),

  setWebhook: (site, user) => {
    const userId = user.id || user;

    return User.findById(userId)
      .then(fetchedFederalistUser => githubClient(fetchedFederalistUser.githubAccessToken))
      .then(github => createWebhook(github, {
        owner: site.owner,
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

  sendCreateGithubStatusRequest: (accessToken, options) =>
    githubClient(accessToken)
      .then(github => sendCreateGithubStatusRequest(github, options)),

  getOrganizationMembers: (accessToken, organization) =>
    githubClient(accessToken)
      .then(github => getNextOrganizationMembers(github, organization)),

  getTeamMembers: (accessToken, teamId) =>
    githubClient(accessToken)
      .then(github => getNextTeamMembers(github, teamId)),

  removeOrganizationMember: (accessToken, organization, member) =>
    githubClient(accessToken)
      .then(github => removeOrganizationMember(github, organization, member))
      .catch((err) => {
        if (err.code === 404) {
          return null;
        }
        throw err;
      }),
};
