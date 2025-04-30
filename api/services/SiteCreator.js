const GitHub = require('./GitHub');
const TemplateResolver = require('./TemplateResolver');
const { Build, Organization, Site, User } = require('../models');
const utils = require('../utils');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const config = require('../../config');

const apiClient = new CloudFoundryAPIClient();

const defaultEngine = 'jekyll';

function paramsForNewSite(params) {
  const owner = params.owner ? params.owner.toLowerCase() : null;
  const repository = params.repository ? params.repository.toLowerCase() : null;
  const subdomain = utils.generateSubdomain(owner, repository);
  const organizationId = params.organizationId
    ? parseInt(params.organizationId, 10)
    : null;
  return {
    owner,
    repository,
    defaultBranch: params.defaultBranch,
    engine: params.engine || defaultEngine,
    organizationId,
    subdomain,
  };
}

function paramsForNewBuild({ user, site }) {
  return {
    user: user.id,
    site: site.id,
    branch: site.defaultBranch,
    username: user.username,
  };
}

function ownerIsFederalistUser(owner) {
  return User.findOne({
    where: {
      username: owner,
    },
    attributes: ['username'],
  });
}

function checkSiteExists({ owner, repository, organizationId }) {
  return Site.findOne({
    where: {
      owner,
      repository,
    },
    include: [
      {
        model: Organization,
        where: { id: organizationId },
      },
    ],
  }).then((existingSite) => {
    if (existingSite) {
      const error = new Error(
        `This site has already been added to ${config.app.appName}.`,
      );
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
          message:
            `${config.app.appName} can't confirm org permissions for '${owner}'.` +
            // eslint-disable-next-line max-len
            `Either '${owner}' hasn't approved access for ${config.app.appName} or you aren't an org member.` +
            // eslint-disable-next-line max-len
            `Ensure you are an org member and ask an org owner to authorize ${config.app.appName} for the organization.`,
          status: 403,
        };
      }
    });
}

function checkGithubRepository({ user, owner, repository }) {
  return GitHub.getRepository(user, owner, repository).then((repo) => {
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
    return repo;
  });
}

function buildSite(params, s3) {
  const siteParams = {
    ...params,
    s3ServiceName: s3.serviceName,
    awsBucketName: s3.bucket,
    awsBucketRegion: s3.region,
  };

  const site = Site.build(siteParams);

  return site
    .validate()
    .then(() => ({ site, s3: { bucket: s3.bucket, region: s3.region } }));
}

function buildInfrastructure(params, s3ServiceName) {
  return apiClient
    .createSiteBucket(s3ServiceName, config.env.cfSpaceGuid)
    .then(() => apiClient.fetchServiceInstanceCredentials(s3ServiceName))
    .then((credentials) => {
      const s3 = {
        serviceName: s3ServiceName,
        bucket: credentials.bucket,
        region: credentials.region,
      };

      return buildSite(params, s3);
    });
}

function validateSite(params) {
  const s3ServiceName = utils.generateS3ServiceName(params.owner, params.repository);

  if (!s3ServiceName) {
    // Will always not create a valid site object
    // Used to throw the invalid model error and messaging
    const site = Site.build(params);

    return site.validate().then(() => site);
  }

  return buildInfrastructure(params, s3ServiceName);
}

/**
 * Accepts an object describing the new site's attributes and a
 * Federalist user object.
 *
 * returns the new site record
 */
async function saveAndBuildSite({ site, user }) {
  const webhook = await GitHub.setWebhook(site, user.githubAccessToken);

  // This will be `undefined` if the webhook already exists
  if (webhook) {
    site.set('webhookId', webhook.data.id);
  }

  await site.save();

  // Currently uses site.defaultBranch to
  // create site branch config via validateSite function
  // will need to change in the future once the defaultBranch column is dropped from site
  await site.createSiteBranchConfig({
    branch: site.defaultBranch,
    context: 'site',
    s3Key: `/site/${site.owner}/${site.repository}`,
  });

  const buildParams = paramsForNewBuild({
    site,
    user,
  });

  await Build.create(buildParams).then((build) => build.enqueue());
  return site;
}

async function createSiteFromExistingRepo({ siteParams, user }) {
  const { owner, repository, organizationId } = siteParams;

  await checkSiteExists({
    owner,
    repository,
    organizationId,
  });
  const repo = await checkGithubRepository({
    user,
    owner,
    repository,
  });
  await checkGithubOrg({
    user,
    owner,
  });
  const { site, s3 } = await validateSite({
    ...siteParams,
    defaultBranch: repo.default_branch,
  });

  const savedSite = await saveAndBuildSite({
    site,
    user,
  });

  return { site: savedSite, s3 };
}

async function createSiteFromTemplate({ siteParams, user, template }) {
  const params = {
    ...siteParams,
    defaultBranch: template.branch,
    engine: template.engine,
  };
  const { owner, repository } = params;

  const { site, s3 } = await validateSite(params);
  await GitHub.createRepoFromTemplate(user, owner, repository, template);
  const savedSite = await saveAndBuildSite({
    site,
    user,
  });

  return { site: savedSite, s3 };
}

function createSite({ user, siteParams }) {
  const templateName = siteParams.template;

  const template = templateName && TemplateResolver.getTemplate(templateName);
  const newSiteParams = paramsForNewSite(siteParams);

  if (template) {
    return createSiteFromTemplate({
      siteParams: newSiteParams,
      template,
      user,
    });
  }

  return createSiteFromExistingRepo({
    siteParams: newSiteParams,
    user,
  });
}

module.exports = {
  createSite,
};
