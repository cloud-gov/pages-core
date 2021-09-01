const { Octokit } = require('@octokit/rest');
const config = require('../../config');

const createRepoForOrg = (github, options) => github.repos.createInOrg(options);

const createRepoForUser = (github, options) => github.repos.createForAuthenticatedUser(options);

const createWebhook = (github, options) => github.repos.createWebhook(options);

const deleteWebhook = (github, options) => github.repos.deleteWebhook(options);

const listWebhooks = (github, options) => github.repos.listWebhooks(options);

const getOrganizations = github => github.orgs.listForAuthenticatedUser().then(orgs => orgs.data);

const getRepository = (github, options) => github.repos.get(options).then(repos => repos.data);

const getContent = (github, options) => github.repos.getContent(options);

const getBranch = (github, { owner, repo, branch }) => github.repos
  .getBranch({ owner, repo, branch })
  .then(branchInfo => branchInfo.data);

const githubClient = async accessToken => new Octokit({ auth: accessToken });

const parseGithubErrorMessage = (error) => {
  let githubError = 'Encountered an unexpected GitHub error';

  try {
    githubError = error.errors[0].message;
  } catch (e) {
    try {
      githubError = error.message;
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
  } else if (githubError && error.status === 403) {
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

const sendNextCreateGithubStatusRequest = (github, options) => github.repos.createCommitStatus(
  options
);

const sendCreateGithubStatusRequest = (github, options, attempt = 0) => {
  const maxTries = 5;
  return sendNextCreateGithubStatusRequest(github, options)
    .catch((err) => {
      attempt += 1; // eslint-disable-line no-param-reassign
      if (attempt < maxTries) {
        return sendCreateGithubStatusRequest(github, options, attempt);
      }
      throw err;
    });
};

const getOrganizationMembers = (github, org, role = 'all', page = 1) => github.orgs.listMembers({
  org, per_page: 100, page, role,
})
  .then(orgs => orgs.data);

function getNextOrganizationMembers(github, org, role = 'all', { page = 1, allMembers = [] } = {}) {
  return getOrganizationMembers(github, org, role, page)
    .then((members) => {
      if (members.length > 0) {
        allMembers = allMembers.concat(members); // eslint-disable-line no-param-reassign
        return getNextOrganizationMembers(github, org, role, { page: page + 1, allMembers });
      }
      return allMembers;
    });
}

/* eslint-disable camelcase */
const getTeamMembers = (github, org, team_slug, page = 1) => github.teams
  .listMembersInOrg({
    org, team_slug, per_page: 100, page,
  })
  .then(teams => teams.data);

function getNextTeamMembers(github, org, team_slug, page = 1, allMembers = []) {
  return getTeamMembers(github, org, team_slug, page)
    .then((members) => {
      if (members.length > 0) {
        allMembers = allMembers.concat(members); // eslint-disable-line no-param-reassign
        return getNextTeamMembers(github, org, team_slug, page + 1, allMembers);
      }
      return allMembers;
    });
}
/* eslint-enable camelcase */

const removeOrganizationMember = (github, org, username) => github.orgs
  .removeMember({ org, username });

const getRepositories = (github, page = 1) => github.repos.listForAuthenticatedUser({
  per_page: 100, page,
})
  .then(repos => repos.data);

const getNextRepositories = (github, page = 1, allRepos = []) => getRepositories(github, page)
  .then((repos) => {
    if (repos.length > 0) {
      allRepos = allRepos.concat(repos); // eslint-disable-line no-param-reassign
      return getNextRepositories(github, page + 1, allRepos);
    }
    return allRepos;
  });

const getCollaborators = (github, owner, repo, page = 1) => github.repos.listCollaborators({
  owner, repo, per_page: 100, page,
})
  .then(collabs => collabs.data);

function getNextCollaborators(github, owner, repo, { page = 1, allCollabs = [] } = {}) {
  return getCollaborators(github, owner, repo, page)
    .then((collabs) => {
      if (collabs.length > 0) {
        allCollabs = allCollabs.concat(collabs); // eslint-disable-line no-param-reassign
        return getNextCollaborators(github, owner, repo, { page: page + 1, allCollabs });
      }
      return allCollabs;
    });
}

async function findWebhookId(github, site) {
  const { owner, repository: repo } = site;

  const { app_env: appEnv } = config.app;

  //
  // Hardcoded since:
  // - only Federalist webhooks will be missing webhook Ids
  // - webhooks will only be present for production and staging environments
  // - this isn't configured by environment bc if this is Pages, we still want to remove the
  //   Federalist webhook and Pages webhooks will be stored in the site model so this function
  //   will not be called.
  //
  const ext = appEnv === 'staging' ? '-staging' : '';
  const hookUrl = `https://federalistapp${ext}.18f.gov/webhook/github`;

  const hooks = await listWebhooks(github, { owner, repo });
  const federalistHook = hooks.data.find(hook => hook.config.url === hookUrl);

  return federalistHook?.id;
}

module.exports = {
  checkPermissions: async (user, owner, repo) => {
    const github = await githubClient(user.githubAccessToken);
    const repository = await getRepository(github, { owner, repo, username: user.username });
    return repository.permissions;
  },

  checkOrganizations: (user, orgName) => githubClient(user.githubAccessToken)
    .then(github => getOrganizations(github))
    .then(orgs => orgs.some(org => org.login.toLowerCase() === orgName)),

  createRepo: (user, owner, repository) => githubClient(user.githubAccessToken)
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

  createRepoFromTemplate: (user, owner, name, template) => githubClient(user.githubAccessToken)
    .then((github) => {
      const params = {
        template_owner: template.owner,
        template_repo: template.repo,
        name,
      };

      if (user.username.toLowerCase() !== owner.toLowerCase()) {
        params.owner = owner;
      }

      return github.repos.createUsingTemplate(params);
    })
    .catch(handleCreateRepoError),

  getRepository: (user, owner, repo) => githubClient(user.githubAccessToken)
    .then(github => getRepository(github, { owner, repo }))
    .catch((err) => {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }),

  getBranch: (user, owner, repo, branch) => githubClient(user.githubAccessToken)
    .then(github => getBranch(github, { owner, repo, branch }))
    .catch((err) => {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }),

  setWebhook: (site, githubAccessToken) => githubClient(githubAccessToken)
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
    .catch(handleWebhookError),

  deleteWebhook: async (site, githubAccessToken) => {
    const github = await githubClient(githubAccessToken);

    const webhookId = site.webhookId || await findWebhookId(github, site)
      .catch(handleWebhookError);

    if (!webhookId) {
      return null;
    }

    const { owner, repository: repo } = site;

    return deleteWebhook(github, { owner, repo, hook_id: webhookId })
      .catch(handleWebhookError);
  },

  validateUser: (accessToken, throwOnUnauthorized = true) => {
    const approvedOrgs = config.passport.github.organizations || [];

    return githubClient(accessToken)
      .then(github => getOrganizations(github))
      .then((organizations) => {
        const approvedOrg = organizations
          .find(organization => approvedOrgs.indexOf(organization.id) >= 0);

        if (!approvedOrg && throwOnUnauthorized) {
          throw new Error('Unauthorized');
        }

        return !!approvedOrg;
      });
  },

  ensureFederalistAdmin: (accessToken, username) => githubClient(accessToken)
    .then(github => github.teams.getMembershipForUserInOrg({
      org: config.admin.org,
      team_slug: config.admin.team,
      username,
    }))
    .then(({ data: { state, role } }) => {
      if (state !== 'active' || !['member', 'maintainer'].includes(role)) {
        throw new Error('You are not a Federalist admin.');
      }
    }),

  sendCreateGithubStatusRequest: (accessToken, options) => githubClient(accessToken)
    .then(github => sendCreateGithubStatusRequest(github, options)),

  getOrganizationMembers: (accessToken, organization, role = 'all') => githubClient(accessToken)
    .then(github => getNextOrganizationMembers(github, organization, role)),

  getTeamMembers: (accessToken, org, teamSlug) => githubClient(accessToken)
    .then(github => getNextTeamMembers(github, org, teamSlug)),

  removeOrganizationMember: (accessToken, organization, member) => githubClient(accessToken)
    .then(github => removeOrganizationMember(github, organization, member))
    .catch((err) => {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }),

  getRepositories: accessToken => githubClient(accessToken)
    .then(github => getNextRepositories(github)),

  getCollaborators: (accessToken, owner, repo) => githubClient(accessToken)
    .then(github => getNextCollaborators(github, owner, repo)),

  getContent: async (accessToken, owner, repo, path, ref = null) => {
    try {
      const github = await githubClient(accessToken);
      const options = { owner, repo, path };
      if (ref) {
        options.ref = ref;
      }
      const { data } = await getContent(github, options);
      if (data.type === 'file') { // return file body
        const { content, encoding } = data;
        return Buffer.from(content, encoding).toString('utf8');
      }
      return data; // return folder/files
    } catch (err) {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }
  },
};
