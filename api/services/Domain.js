const IORedis = require('ioredis');

const { Domain } = require('../models');
const { path: sitePath, siteViewDomain } = require('../utils/site');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const { DomainQueue } = require('../queues');
const config = require('../../config');

const DnsService = require('./Dns');

const { States } = Domain;

/**
 * @typedef {object} DomainModel
 * @prop {string} state
 */

function cfApi() {
  return new CloudFoundryAPIClient();
}

function queue() {
  const { redis: redisConfig } = config;
  return new DomainQueue(
    new IORedis(redisConfig.url, { tls: redisConfig.tls })
  );
}

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
    throw new Error(`Only '${States.Pending}' domains can be destroyed.`);
  }
  await domain.destroy();
}

/**
 * @param {DomainModel} domain The domain
 */
function canDeprovision(domain) {
  const { Provisioning, Provisioned, Failed } = States;
  return [Provisioning, Provisioned, Failed].includes(domain.state);
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
  queue().add('checkDeprovisionStatus', { id });
}

/**
 * @param {number} id The id of the domain
 */
function queueProvisionStatusCheck(id) {
  queue().add('checkProvisionStatus', { id });
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
      .map(domainName => DnsService.checkDnsRecords(domainName))
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
      .map(domainName => DnsService.checkAcmeChallengeDnsRecord(domainName))
  );
}

/**
 * @param {DomainModel} domain The domain
 * @returns {Promise<DomainModel>}
 */
async function deprovision(domain) {
  if (!canDeprovision(domain)) {
    throw new Error(`Only '${States.Provisioning}', '${States.Provisioned}', or '${States.Failed}' domains can be deprovisioned.`);
  }

  await cfApi().deleteServiceInstance(domain.serviceName);

  await domain.update({ state: States.Deprovisioning });

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
    throw new Error(`Only '${States.Pending}' domains can be provisioned.`);
  }

  if (!dnsResults.some(dnsResult => DnsService.isAcmeChallengeDnsRecord(dnsResult.record))) {
    throw new Error('There must be at least one Acme Challenge DNS record provided');
  }

  if (!DnsService.canProvision(dnsResults)) {
    throw new Error('The Acme Challenge DNS records must be set correctly before the domain can be provisioned.');
  }

  const site = await domain.getSite();

  const [firstDomainName] = domain.names.split(',');

  const serviceName = `${firstDomainName}-ext`;
  const origin = siteViewDomain(site);
  const path = sitePath(site, domain.context);

  await cfApi().createExternalDomain(
    domain.names,
    serviceName,
    origin,
    path
  );

  await domain.update({
    origin,
    path,
    serviceName,
    state: States.Provisioning,
  });

  queueProvisionStatusCheck(domain.id);

  return domain;
}

/**
 * @param {number} id The domain id
 */
async function checkDeprovisionStatus(id) {
  const domain = await Domain.findOne({
    where: {
      state: Domain.States.Deprovisioning,
      id,
    },
  });

  if (!domain) {
    return;
  }

  const { resources } = await cfApi().fetchServiceInstances(domain.serviceName);

  if (resources.length === 0) {
    await domain.update({
      origin: null,
      path: null,
      serviceName: null,
      state: States.Pending,
    });
  } else {
    queueDeprovisionStatusCheck(id);
  }
}

async function checkProvisionStatus(id) {
  const domain = await Domain.findOne({
    where: {
      state: Domain.States.Provisioning,
      id,
    },
  });

  if (!domain) {
    return;
  }

  const service = await cfApi().fetchServiceInstance(domain.serviceName);

  switch (service.entity.last_operation) {
    case 'succeeded':
      await domain.update({ state: States.Provisioned });
      break;
    case 'failed':
      await domain.update({ state: States.Failed });
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
