const { Site, UAAIdentity, User } = require('../models');
const GitHub = require('./GitHub');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const { generateS3ServiceName, generateSubdomain } = require('../utils');

const apiClient = new CloudFoundryAPIClient();

async function getUserGHCredentials(email) {
  const uaaUser = await UAAIdentity.findOne({
    where: { email },
    include: [User],
    raw: true,
    nest: true,
  });

  if (!uaaUser) throw new Error('No UAA Identity exists with that email.');

  const { githubAccessToken, githubUserId } = uaaUser.User;

  return {
    githubAccessToken,
    githubUserId,
  };
}

async function setRepoWebhook(site, uaaEmail) {
  const { githubAccessToken } = await getUserGHCredentials(uaaEmail);
  const webhook = await GitHub.setWebhook(site, githubAccessToken);

  if (webhook) {
    site.set('webhookId', webhook.data.id);
  }

  return site.save();
}

async function updateSiteServices(oldServceName, newServiceName) {
  const s3ServiceInstance = await apiClient.fetchServiceInstance(oldServceName);
  const s3KeyInstance = await apiClient.fetchCredentialBindingsInstance(
    `${oldServceName}-key`,
  );

  // Rename s3 service instance
  await apiClient.authRequest(
    'PATCH',
    `/v3/service_instances/${s3ServiceInstance.guid}/`,
    {
      name: newServiceName,
    },
  );

  // Create new service key based on new service name
  await apiClient.createServiceKey(newServiceName, s3ServiceInstance.guid);

  // Delete old service key
  await apiClient.authRequest(
    'DELETE',
    `/v3/service_credential_bindings/${s3KeyInstance.guid}`,
  );
}

async function siteRepoMigrator(siteId, uaaEmail, { repository, owner }) {
  const subdomain = generateSubdomain(owner, repository);
  const s3ServiceName = generateS3ServiceName(owner, repository);
  const site = await Site.findByPk(siteId);
  const oldS3ServiceName = site.s3ServiceName;

  site.set({
    owner,
    repository,
    s3ServiceName,
    subdomain,
  });

  await site.save();
  await updateSiteServices(oldS3ServiceName, s3ServiceName);
  await setRepoWebhook(site, uaaEmail);
}

module.exports = {
  getUserGHCredentials,
  setRepoWebhook,
  siteRepoMigrator,
  updateSiteServices,
};
