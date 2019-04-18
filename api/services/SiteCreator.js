const GitHub = require('./GitHub');
const TemplateResolver = require('./TemplateResolver');
const { Build, Site, User } = require('../models');

const defaultEngine = 'jekyll';

function paramsForNewSite(params) {
  return {
    owner: params.owner ? params.owner.toLowerCase() : null,
    repository: params.repository ? params.repository.toLowerCase() : null,
    defaultBranch: params.defaultBranch,
    engine: params.engine || defaultEngine,
  };
}

function paramsForNewBuildSource(template) {
  if (template) {
    return {
      repository: template.repo,
      owner: template.owner,
      branch: template.branch,
    };
  }

  return null;
}

function paramsForNewBuild({ user, site, template = {} }) {
  return {
    user: user.id,
    site: site.id,
    branch: site.defaultBranch,
    source: paramsForNewBuildSource(template),
  };
}

function ownerIsFederalistUser(owner) {
  return User.findOne({
    where: { username: owner },
    attributes: ['username'],
  });
}

function checkSiteExists({ owner, repository }) {
  return Site.findOne({
    where: { owner, repository },
  })
  .then((existingSite) => {
    if (existingSite) {
      const error = new Error('This site has already been added to Federalist.');
      error.status = 400;
      throw error;
    }
  });
}

function checkGithubOrg({ user, owner }) {
  return ownerIsFederalistUser(owner)
  .then((model) => {
    if (model) {
      // Owner of the repo is a user with a DB record, and not an org.
      // Drop down to the next promise and bypass the org check
      return Promise.resolve(true);
    }

    return GitHub.checkOrganizations(user, owner);
  })
  .then((federalistAuthorizedOrg) => {
    // Has this org authorized federalist as an oauth app?
    if (!federalistAuthorizedOrg) {
      throw {
        message: `Federalist can't confirm org permissions for '${owner}'. ` +
          `Either '${owner}' hasn't approved access for Federalist or you aren't an org member. ` +
          'Ensure you are an org member and ask an org owner to authorize Federalist for the organization.',
        status: 403,
      };
    }
  });
}

function checkGithubRepository({ user, owner, repository }) {
  return GitHub.getRepository(user, owner, repository)
    .then((repo) => {
      if (!repo) {
        throw {
          message: `The repository ${owner}/${repository} does not exist.`,
          status: 400,
        };
      }
      if (!repo.permissions.admin) {
        throw {
          message: 'You do not have admin access to this repository',
          status: 400,
        };
      }
      return true;
    });
}

function validateSite(params) {
  const site = Site.build(params);

  return site.validate()
    .then(() => site);
}

/**
 * Accepts an object describing the new site's attributes and a
 * Federalist user object.
 *
 * returns the new site record
 */
function saveAndBuildSite({ site, user, template }) {
  let model;

  return GitHub.setWebhook(site, user.id)
  .then(() => site.save())
  .then((createdSite) => {
    model = createdSite;

    const buildParams = paramsForNewBuild({
      site: model,
      user,
      template,
    });

    return Promise.all([
      site.addUser(user.id),
      Build.create(buildParams),
    ]);
  })
  .then(() => model);
}

function createSiteFromExistingRepo({ siteParams, user }) {
  const { owner, repository } = siteParams;

  return checkSiteExists({ owner, repository })
  .then(() => checkGithubRepository({ user, owner, repository }))
  .then(() => checkGithubOrg({ user, owner }))
  .then(() => validateSite(siteParams))
  .then(site => saveAndBuildSite({ site, user }));
}

function createSiteFromTemplate({ siteParams, user, template }) {
  const params = Object.assign({}, siteParams, {
    defaultBranch: template.branch,
    engine: template.engine,
  });
  const { owner, repository } = params;
  let site;

  return validateSite(params)
  .then((model) => {
    site = model;
    return GitHub.createRepo(user, owner, repository);
  })
  .then(() => saveAndBuildSite({ site, user, template }));
}

function createSiteFromSource({ siteParams, user }) {
  const { owner, repository, source } = siteParams;

  return checkSiteExists({ owner, repository })
  .then(() => checkGithubRepository({ user, owner: source.owner, repository: source.repo }))
  .then(() => checkGithubOrg({ user, owner: source.owner }))
  .then(() => GitHub.createRepo(user, owner, repository))
  .then(() => validateSite(siteParams))
  .then(site => saveAndBuildSite({ site, user, template: siteParams.source }));
}

function createSite({ user, siteParams }) {
  const templateName = siteParams.template;

  const template = templateName && TemplateResolver.getTemplate(templateName);
  const newSiteParams = paramsForNewSite(siteParams);

  if (template) {
    return createSiteFromTemplate({ siteParams: newSiteParams, template, user });
  } else if (siteParams.source) {
    return createSiteFromSource({
      siteParams: Object.assign({}, newSiteParams, { source: siteParams.source }),
      user,
    });
  }
  return createSiteFromExistingRepo({ siteParams: newSiteParams, user });
}

module.exports = {
  createSite,
};
