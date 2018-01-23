const GitHub = require('./GitHub');
const config = require('../../config');
const { Build, Site, User } = require('../models');

function paramsForNewSite(params) {
  return {
    owner: params.owner ? params.owner.toLowerCase() : null,
    repository: params.repository ? params.repository.toLowerCase() : null,
    defaultBranch: params.defaultBranch,
    engine: params.engine,
  };
}

function templateForTemplateName(templateName) {
  const template = config.templates[templateName];
  if (!template) {
    const error = new Error(`No such template: ${templateName}`);
    error.status = 400;
    throw error;
  }
  return template;
}

function paramsForNewBuildSource(templateName) {
  if (templateName) {
    const template = templateForTemplateName(templateName);
    return { repository: template.repo, owner: template.owner };
  }
  return null;
}

function paramsForNewBuild({ user, site, template }) {
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

function checkGithubOrg({ user, owner }) {
  return ownerIsFederalistUser(owner)
  .then((model) => {
    if (model) {
      // Owner of the repo is a user, not an org.
      // They exist in our DB, drop down to the next promise and bypass
      return Promise.resolve(true);
    }

    return GitHub.checkOrganizations(user, owner);
  })
  .then((federalistAuthorizedOrg) => {
    // Has this org authorized federalist as an oauth app?
    if (!federalistAuthorizedOrg) {
      throw {
        message: `Organization '${owner}' hasn't approved access for Federalist. Ask an owner to authorize it.`,
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

function createAndBuildSite({ siteParams, user }) {
  let site = Site.build(siteParams);

  return site.validate()
    .then((error) => {
      if (error) {
        throw error;
      }
      return GitHub.setWebhook(site, user.id);
    })
    .then(() => site.save()).then((createdSite) => {
      site = createdSite;

      const buildParams = paramsForNewBuild({ site, user });
      return Build.create(buildParams);
    })
    .then(() => site);
}

function createSiteFromExistingRepo({ siteParams, user }) {
  let site;
  const { owner, repository } = siteParams;

  return Site.findOne({
    where: { owner, repository },
  })
  .then((existingSite) => {
    if (existingSite) {
      const error = new Error('This site has already been added to Federalist');
      error.status = 400;
      throw error;
    }
    return checkGithubRepository({ user, owner, repository });
  })
  .then(() => checkGithubOrg({ user, owner }))
  .then(() => createAndBuildSite({ siteParams, user }))
  .then((model) => {
    site = model;
    return site.addUser(user.id);
  })
  .then(() => site);
}

function createSiteFromTemplate({ siteParams, user, template }) {
  let site = Site.build(siteParams);
  site.engine = 'jekyll';
  site.defaultBranch = templateForTemplateName(template).branch;
  const { owner, repository } = siteParams;

  return site.validate()
    .then((error) => {
      if (error) {
        throw error;
      }
      return GitHub.createRepo(user, owner, repository);
    })
    .then(() => GitHub.setWebhook(site, user))
    .then(() => site.save())
    .then((createdSite) => {
      site = createdSite;
      return site.addUser(user.id);
    })
    .then(() => {
      const buildParams = paramsForNewBuild({ user, site, template });
      return Build.create(buildParams);
    })
    .then(() => site);
}

function createSite({ user, siteParams }) {
  const template = siteParams.template;
  const newSiteParams = paramsForNewSite(siteParams);

  if (template) {
    return createSiteFromTemplate({ siteParams: newSiteParams, template, user });
  }
  return createSiteFromExistingRepo({ siteParams: newSiteParams, user });
}

module.exports = {
  createSite,
};
