const { Gitlab } = require('@gitbeaker/node');
const config = require('../../config');
const { User } = require('../models');

const createRepoForOrg = (gitlab, options) => gitlab.repos.createInOrg(options);

const createRepoForUser = (gitlab, options) => gitlab.repos.createForAuthenticatedUser(options);

const createWebhook = (gitlab, options) => gitlab.repos.createWebhook(options);

const getOrganizations = gitlab => gitlab.Projects.all({ maxPages: 2, perPage: 40 });

const getRepository = (gitlab, options) => gitlab.repos.get(options).then(repos => repos.data);

const getBranch = (gitlab, { owner, repo, branch }) => gitlab.repos
  .getBranch({ owner, repo, branch })
  .then(branchInfo => branchInfo.data);

const gitlabClient = async accessToken => new Gitlab({ token: accessToken });

const parseGitlabErrorMessage = (error) => {
  let gitlabError = 'Encountered an unexpected GitLab error';

  try {
    gitlabError = error.errors[0].message;
  } catch (e) {
    try {
      gitlabError = error.message;
    } catch (e2) { /* noop */ }
  }

  return gitlabError;
};

const handleCreateRepoError = (err) => {
  const error = err;

  const REPO_EXISTS_MESSAGE = 'name already exists on this account';

  const gitlabError = parseGitlabErrorMessage(error);

  if (gitlabError === REPO_EXISTS_MESSAGE) {
    error.status = 400;
    error.message = 'A repo with that name already exists.';
  } else if (gitlabError && error.status === 403) {
    error.status = 400;
    error.message = gitlabError;
  }

  throw error;
};

const handleWebhookError = (err) => {
  const error = err;
  const HOOK_EXISTS_MESSAGE = 'Hook already exists on this repository';
  const NO_ACCESS_MESSAGE = 'Not Found';
  const NO_ADMIN_ACCESS_ERROR_MESSAGE = 'You do not have admin access to this repository';

  const gitlabError = parseGitlabErrorMessage(error);

  if (gitlabError === HOOK_EXISTS_MESSAGE) {
    // noop
  } else if (gitlabError === NO_ACCESS_MESSAGE) {
    const adminAccessError = new Error(NO_ADMIN_ACCESS_ERROR_MESSAGE);
    adminAccessError.status = 400;
    throw adminAccessError;
  } else {
    throw error;
  }
};

const getOrganizationMembers = (gitlab, org, role = 'all', page = 1) => gitlab.orgs.listMembers({
  org, per_page: 100, page, role,
})
  .then(orgs => orgs.data);

function getNextOrganizationMembers(gitlab, org, role = 'all', { page = 1, allMembers = [] } = {}) {
  return getOrganizationMembers(gitlab, org, role, page)
    .then((members) => {
      if (members.length > 0) {
        allMembers = allMembers.concat(members); // eslint-disable-line no-param-reassign
        return getNextOrganizationMembers(gitlab, org, role, { page: page + 1, allMembers });
      }
      return allMembers;
    });
}

/* eslint-disable camelcase */
const getTeamMembers = (gitlab, org, team_slug, page = 1) => gitlab.teams
  .listMembersInOrg({
    org, team_slug, per_page: 100, page,
  })
  .then(teams => teams.data);

function getNextTeamMembers(gitlab, org, team_slug, page = 1, allMembers = []) {
  return getTeamMembers(gitlab, org, team_slug, page)
    .then((members) => {
      if (members.length > 0) {
        allMembers = allMembers.concat(members); // eslint-disable-line no-param-reassign
        return getNextTeamMembers(gitlab, org, team_slug, page + 1, allMembers);
      }
      return allMembers;
    });
}
/* eslint-enable camelcase */

const removeOrganizationMember = (gitlab, org, username) => gitlab.orgs
  .removeMember({ org, username });

const getRepositories = (gitlab, page = 1) => gitlab.repos.listForAuthenticatedUser({
  per_page: 100, page,
})
  .then(repos => repos.data);

const getNextRepositories = (gitlab, page = 1, allRepos = []) => getRepositories(gitlab, page)
  .then((repos) => {
    if (repos.length > 0) {
      allRepos = allRepos.concat(repos); // eslint-disable-line no-param-reassign
      return getNextRepositories(gitlab, page + 1, allRepos);
    }
    return allRepos;
  });

const getCollaborators = (gitlab, owner, repo, page = 1) => gitlab.repos.listCollaborators({
  owner, repo, per_page: 100, page,
})
  .then(collabs => collabs.data);

function getNextCollaborators(gitlab, owner, repo, { page = 1, allCollabs = [] } = {}) {
  return getCollaborators(gitlab, owner, repo, page)
    .then((collabs) => {
      if (collabs.length > 0) {
        allCollabs = allCollabs.concat(collabs); // eslint-disable-line no-param-reassign
        return getNextCollaborators(gitlab, owner, repo, { page: page + 1, allCollabs });
      }
      return allCollabs;
    });
}

module.exports = {
  checkPermissions: (user, owner, repo) => gitlabClient(user.gitlabAccessToken)
    .then(gitlab => getRepository(gitlab, { owner, repo, username: user.username }))
    .then(repository => repository.permissions),

  checkOrganizations: (user, orgName) => gitlabClient(user.gitlabAccessToken)
    .then(gitlab => getOrganizations(gitlab))
    .then(orgs => orgs.some(org => org.login.toLowerCase() === orgName)),

  createRepo: (user, owner, repository) => gitlabClient(user.gitlabAccessToken)
    .then((gitlab) => {
      if (user.username.toLowerCase() === owner.toLowerCase()) {
        return createRepoForUser(gitlab, {
          name: repository,
        });
      }

      return createRepoForOrg(gitlab, {
        name: repository,
        org: owner,
      });
    })
    .catch(handleCreateRepoError),

  createRepoFromTemplate: (user, owner, name, template) => gitlabClient(user.gitlabAccessToken)
    .then((gitlab) => {
      const params = {
        template_owner: template.owner,
        template_repo: template.repo,
        name,
      };

      if (user.username.toLowerCase() !== owner.toLowerCase()) {
        params.owner = owner;
      }

      return gitlab.repos.createUsingTemplate(params);
    })
    .catch(handleCreateRepoError),

  getRepository: (user, owner, repo) => gitlabClient(user.gitlabAccessToken)
    .then(gitlab => getRepository(gitlab, { owner, repo }))
    .catch((err) => {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }),

  getBranch: (user, owner, repo, branch) => gitlabClient(user.gitlabAccessToken)
    .then(gitlab => getBranch(gitlab, { owner, repo, branch }))
    .catch((err) => {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }),

  setWebhook: (site, user) => {
    const userId = user.id || user;

    return User.findByPk(userId)
      .then(fetchedFederalistUser => gitlabClient(fetchedFederalistUser.gitlabAccessToken))
      .then(gitlab => createWebhook(gitlab, {
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

  validateUser: (accessToken, throwOnUnauthorized = true) => {
    const approvedOrgs = config.passport.gitlab.organizations || [];

    return gitlabClient(accessToken)
      .then(gitlab => getOrganizations(gitlab))
      .then((organizations) => {
        const approvedOrg = organizations
          .find(organization => approvedOrgs.indexOf(organization.id) >= 0);

        if (!approvedOrg && throwOnUnauthorized) {
          throw new Error('Unauthorized');
        }

        return !!approvedOrg;
      });
  },

  ensureFederalistAdmin: (accessToken, username) => gitlabClient(accessToken)
    .then(gitlab => gitlab.teams.getMembershipForUserInOrg({
      org: config.admin.org,
      team_slug: config.admin.team,
      username,
    }))
    .then(({ data: { state, role } }) => {
      if (state !== 'active' || !['member', 'maintainer'].includes(role)) {
        throw new Error('You are not a Federalist admin.');
      }
    }),

  getOrganizationMembers: (accessToken, organization, role = 'all') => gitlabClient(accessToken)
    .then(gitlab => getNextOrganizationMembers(gitlab, organization, role)),

  getTeamMembers: (accessToken, org, teamSlug) => gitlabClient(accessToken)
    .then(gitlab => getNextTeamMembers(gitlab, org, teamSlug)),

  removeOrganizationMember: (accessToken, organization, member) => gitlabClient(accessToken)
    .then(gitlab => removeOrganizationMember(gitlab, organization, member))
    .catch((err) => {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }),

  getRepositories: accessToken => gitlabClient(accessToken)
    .then(gitlab => getNextRepositories(gitlab)),

  getCollaborators: (accessToken, owner, repo) => gitlabClient(accessToken)
    .then(gitlab => getNextCollaborators(gitlab, owner, repo)),
};
