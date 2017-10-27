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
    throw new Error(`No such template: ${templateName}`);
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

function checkExistingGithubRepository({ user, owner, repository, site }) {
  return GitHub.getRepository(user, owner, repository)
    .then((repo) => {
      if (!repo) {
        throw {
          message: `The repository ${owner}/${repository} does not exist.`,
          status: 400,
        };
      }
      if (!repo.permissions.admin && !site) {
        throw {
          message: 'You do not have admin access to this repository',
          status: 400,
        };
      }
      if (!repo.permissions.push) {
        throw {
          message: 'You do not have write access to this repository',
          status: 400,
        };
      }
      return true;
    });
}

function checkForExistingSiteErrors({ site, user }) {
  const existingUser = site.Users.find(candidate => candidate.id === user.id);
  if (existingUser) {
    throw {
      message: "You've already added this site to Federalist",
      status: 400,
    };
  }
  return site;
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


function addUserToSite(owner, repository, user) {
  let site;

  return Site.findOne({
    where: { owner, repository },
    include: [User],
  })
    .then((model) => {
      if (!model) {
        throw {
          message: `Site for ${owner}/${repository} does not yet exist in Federalist`,
          status: 404,
        };
      }
      site = model;
      return site;
    })
    .then(() => checkExistingGithubRepository({ user, owner, repository, site }))
    .then(() => checkForExistingSiteErrors({ site, user }))
    .then(() => site.addUser(user.id))
    .then(() => site);
}


function createSiteFromExistingRepo({ siteParams, user }) {
  let site;
  const { owner, repository } = siteParams;

  return Site.findOne({
    where: { owner, repository },
    include: [User],
  })
    .then((model) => {
      site = model;
      return checkExistingGithubRepository({ user, owner, repository, site });
    })
    .then(() => {
      if (site) {
        return checkForExistingSiteErrors({ site, user });
      }

      return createAndBuildSite({ siteParams, user });
    })
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
  addUserToSite,
};
