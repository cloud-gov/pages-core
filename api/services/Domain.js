const { Domain } = require('../models');
const { path: sitePath, siteViewDomain } = require('../utils/site');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const { DomainQueue } = require('../queues');

const DnsService = require('./Dns');

/**
 * @typedef {object} DomainModel
 * @prop {string} state
 */

/**
 * @param {DomainModel} domain
 */
function canDestroy(domain) {
  return domain.isPending();
}

/**
 * @param {DomainModel} domain
 */
async function destroy(domain) {
  if (!canDestroy(domain)) {
    throw new Error('Only `pending` domains can be destroyed.');
  }
  await domain.destroy();
}

/**
 * @param {DomainModel} domain The domain
 */
function canDeprovision(domain) {
  return ['provisioning', 'created', 'failed'].includes(domain.state);
}

/**
 * @param {number} id The id of the domain
 */
function queueDeprovisionStatusCheck(id) {
  DomainQueue.add('checkDeprovisionStatus', { id });
}

/**
 * @param {number} id The id of the domain
 */
function queueProvisionStatusCheck(id) {
  DomainQueue.add('checkProvisionStatus', { id });
}

/**
 * @param {DomainModel} domain The domain
 * @returns {Promise<DomainModel>}
 */
async function deprovision(domain) {
  if (!canDeprovision(domain)) {
    throw new Error('Only `provisioning`, `created`, or `failed` domains can be deprovisioned.');
  }

  await CloudFoundryAPIClient.deleteServiceInstance(domain.serviceName);

  await domain.update({ state: 'deprovisioning' });

  queueDeprovisionStatusCheck(domain.id);

  return domain;
}

/**
 * @param {DomainModel} domain
 * @param {DnsService.DnsResult[]} dnsResults
 * @returns {Promise<DomainModel>}
 */
async function provision(domain, dnsResults) {
  if (!domain.isPending()) {
    throw new Error('Only `pending` domains can be provisioned.');
  }

  if (!DnsService.canProvision(dnsResults)) {
    throw new Error('The Acme Challenge DNS records must be set correctly before the domain can be provisioned.');
  }

  const site = await domain.getSite();

  // For now...
  if (![site.defaultBranch, site.demoBranch].includes(domain.branch)) {
    throw new Error('Can only create domains for default or demo branch');
  }

  const deployment = domain.branch === site.defaultBranch
    ? 'site'
    : 'demo';

  const [firstDomainName] = domain.names.split(',');

  const serviceName = `${firstDomainName}-ext`;
  const origin = siteViewDomain(site);
  const path = sitePath(site, deployment);

  await CloudFoundryAPIClient.createExternalDomain(
    domain.names,
    serviceName,
    origin,
    path
  );

  await domain.update({
    origin,
    path,
    serviceName,
    state: 'provisioning',
  });

  queueProvisionStatusCheck(domain.id);

  return domain;
}

async function checkDeprovisionStatus(id) {
  const domain = await Domain.findByPk(id);
  const { resources } = await CloudFoundryAPIClient.fetchServiceInstances(domain.serviceName);

  if (resources.length === 0) {
    await domain.update({
      origin: null,
      path: null,
      serviceName: null,
      state: 'pending',
    });
  } else {
    queueDeprovisionStatusCheck(id);
  }
}

async function checkProvisionStatus(id) {
  const domain = await Domain.findByPk(id);
  const service = await CloudFoundryAPIClient.fetchServiceInstance(domain.serviceName);

  switch (service.entity.last_operation) {
    case 'succeeded':
      await domain.update({ state: 'created' });
      break;
    case 'failed':
      await domain.update({ state: 'failed' });
      break;
    default:
      queueProvisionStatusCheck(id);
      break;
  }
}

module.exports.checkDeprovisionStatus = checkDeprovisionStatus;
module.exports.checkProvisionStatus = checkProvisionStatus;
module.exports.destroy = destroy;
module.exports.deprovision = deprovision;
module.exports.provision = provision;
module.exports.queueProvisionStatusCheck = queueProvisionStatusCheck;
