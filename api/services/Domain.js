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
 * @returns {boolean}
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
 * @param {DomainModel} domain The domain
 * @param {DnsService.DnsResult[]} dnsResults The DNS results
 */
function canProvision(domain, dnsResults) {
  return domain.isPending() && DnsService.canProvision(dnsResults);
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
 * @returns {DnsService.DnsRecord[]}
 */
function buildDnsRecords(domain) {
  return domain.names
    .split(',')
    .map(DnsService.buildDnsRecords)
    .flat();
}

/**
 * @param {DomainModel} domain The domain
 * @returns {DnsService.DnsResult[]}
 */
async function checkDnsRecords(domain) {
  const dnsResults = await Promise.all(
    domain.names
      .split(',')
      .map(DnsService.checkDnsRecords)
  );

  return dnsResults.flat();
}

/**
 * @param {DomainModel} domain The domain
 * @returns {DnsService.DnsResult[]}
 */
function checkAcmeChallengeDnsRecord(domain) {
  return Promise.all(
    domain.names
      .split(',')
      .map(DnsService.checkAcmeChallengeDnsRecord)
  );
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

  const [firstDomainName] = domain.names.split(',');

  const serviceName = `${firstDomainName}-ext`;
  const origin = siteViewDomain(site);
  const path = sitePath(site, domain.context);

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

module.exports.buildDnsRecords = buildDnsRecords;
module.exports.canProvision = canProvision;
module.exports.checkDeprovisionStatus = checkDeprovisionStatus;
module.exports.checkAcmeChallengeDnsRecord = checkAcmeChallengeDnsRecord;
module.exports.checkDnsRecords = checkDnsRecords;
module.exports.checkProvisionStatus = checkProvisionStatus;
module.exports.deprovision = deprovision;
module.exports.destroy = destroy;
module.exports.provision = provision;
module.exports.queueProvisionStatusCheck = queueProvisionStatusCheck;
