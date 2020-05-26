const GitHub = require('./GitHub');
const TemplateResolver = require('./TemplateResolver');
const { Build, Site, User } = require('../models');
const { generateS3ServiceName } = require('../utils');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const config = require('../../config');

const apiClient = new CloudFoundryAPIClient();

const defaultEngine = 'jekyll';

function paramsForNewSite(params) {
  return {
    owner: params.owner ? params.owner.toLowerCase() : null,
    repository: params.repository ? params.repository.toLowerCase() : null,
    defaultBranch: params.defaultBranch,
    engine: params.engine || defaultEngine,
    sharedBucket: params.sharedBucket === false ? params.sharedBucket : true,
  };
}

function paramsForNewBuild({ user, site }) {
  return {
    user: user.id,
    site: site.id,
    branch: site.defaultBranch,
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
  }).then((existingSite) => {
    if (existingSite) {
      const error = new Error('This site has already been added to Federalist.');
      error.status = 400;
      throw error;
    }
  });
}

function checkGithubOrg({ user, owner }) {
  return ownerIsFederalistUser(owner).then((model) => {
    if (model) {
      // Owner of the repo is a user with a DB record, and not an org.
      // Drop down to the next promise and bypass the org check
      return Promise.resolve(true);
    }

    return GitHub.checkOrganizations(user, owner);
  }).then((federalistAuthorizedOrg) => {
    // Has this org authorized federalist as an oauth app?
    if (!federalistAuthorizedOrg) {
      throw {
        message: `Federalist can't confirm org permissions for '${owner}'.`
          + `Either '${owner}' hasn't approved access for Federalist or you aren't an org member.`
          + 'Ensure you are an org member and ask an org owner to authorize Federalist for the organization.',
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

function buildSite(params, s3) {
  const siteParams = Object.assign({}, params, {
    s3ServiceName: s3.serviceName,
    awsBucketName: s3.bucket,
    awsBucketRegion: s3.region,
  });

  const site = Site.build(siteParams);

  return site.validate()
    .then(() => site);
}

function buildInfrastructure(params, s3ServiceName) {
  return apiClient.createSiteBucket(s3ServiceName)
    .then((response) => {
      const { credentials } = response.entity;

      const s3 = {
        serviceName: s3ServiceName,
        bucket: credentials.bucket,
        region: credentials.region,
      };

      return apiClient.createSiteProxyRoute(credentials.bucket)
        .then(() => buildSite(params, s3));
    });
}

function validateSite(params) {
  if (params.sharedBucket) {
    return buildSite(params, config.s3);
  }

  const s3ServiceName = generateS3ServiceName(params.owner, params.repository);

  if (!s3ServiceName) {
    // Will always not create a valid site object
    // Used to throw the invalid model error and messaging
    const site = Site.build(params);

    return site.validate()
      .then(() => site);
  }

  return buildInfrastructure(params, s3ServiceName);
}

/**
 * Accepts an object describing the new site's attributes and a
 * Federalist user object.
 *
 * returns the new site record
 */
function saveAndBuildSite({ site, user }) {
  let model;

  return GitHub.setWebhook(site, user.id)
    .then(() => site.save())
    .then((createdSite) => {
      model = createdSite;

      const buildParams = paramsForNewBuild({
        site: model,
        user,
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

async function createSiteFromTemplate({ siteParams, user, template }) {
  const params = {
    ...siteParams,
    defaultBranch: template.branch,
    engine: template.engine,
  };
  const { owner, repository } = params;

  const site = await validateSite(params);
  await GitHub.createRepoFromTemplate(user, owner, repository, template);
  return saveAndBuildSite({ site, user });
}

function createSite({ user, siteParams }) {
  const templateName = siteParams.template;

  const template = templateName && TemplateResolver.getTemplate(templateName);
  const newSiteParams = paramsForNewSite(siteParams);

  if (template) {
    return createSiteFromTemplate({ siteParams: newSiteParams, template, user });
  }

  return createSiteFromExistingRepo({ siteParams: newSiteParams, user });
}

module.exports = {
  createSite,
};
