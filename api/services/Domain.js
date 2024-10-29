const IORedis = require('ioredis');

const { Domain, Build, Site, SiteBranchConfig } = require('../models');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const { DomainQueue } = require('../queues');
const config = require('../../config');

const DnsService = require('./Dns');

const { States } = Domain;

/**
 * @typedef {object} DomainModel
 * @prop {string} state
 */

/**
 * @typedef {object} SiteModel
 */

function cfApi() {
  return new CloudFoundryAPIClient();
}

function queue() {
  const { redis: redisConfig } = config;
  return new DomainQueue(
    new IORedis(redisConfig.url, {
      tls: redisConfig.tls,
      maxRetriesPerRequest: null,
    }),
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
  return domain.names.split(',').map(DnsService.buildDnsRecords).flat();
}

/**
 * @param {DomainModel} domain The domain
 * @returns {DnsService.DnsResult[]}
 */
async function checkDnsRecords(domain) {
  const dnsResults = await Promise.all(
    domain.names.split(',').map((domainName) => DnsService.checkDnsRecords(domainName)),
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
      .map((domainName) => DnsService.checkAcmeChallengeDnsRecord(domainName)),
  );
}

/**
 * @param {SiteModel} site
 * @param {DomainModel[]} domains
 * @param {string} context Domain.Contexts.Site or DomainContexts.Demo
 */
function isSiteUrlManagedByDomain(site, domains, context) {
  const siteDomain = Site.domainFromContext(context);
  if (site[siteDomain] === null) {
    return true;
  }
  if (domains.length === 0) {
    return false;
  }
  return domains
    .filter((domain) => domain.context === context)
    .some((domain) =>
      domain.namesArray().some((name) => `https://${name}` === site[siteDomain]),
    );
}

/**
 * @param {DomainModel} domain
 * @param {SiteModel} site
 */
async function rebuildAssociatedSite(domain) {
  const { branch } = domain.SiteBranchConfig;
  if (branch) {
    await Build.create({
      site: domain.siteId,
      branch,
      username: 'Automated Platfrom Operation',
    }).then((b) => b.enqueue());
  }
}

/**
 * @param {DomainModel} domain The domain
 * @returns {Promise<DomainModel>}
 */
async function deprovision(domain) {
  if (!canDeprovision(domain)) {
    throw new Error(
      // eslint-disable-next-line max-len
      `Only '${States.Provisioning}', '${States.Provisioned}', or '${States.Failed}' domains can be deprovisioned.`,
    );
  }

  await cfApi().deleteServiceInstance(domain.serviceName);

  await domain.update({
    state: States.Deprovisioning,
  });

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

  if (
    !dnsResults.some((dnsResult) => DnsService.isAcmeChallengeDnsRecord(dnsResult.record))
  ) {
    throw new Error('There must be at least one Acme Challenge DNS record provided');
  }

  if (!DnsService.canProvision(dnsResults)) {
    throw new Error(
      // eslint-disable-next-line max-len
      'The Acme Challenge DNS records must be set correctly before the domain can be provisioned.',
    );
  }

  const { serviceName } = domain;
  const { origin } = domain;
  const { path } = domain;

  const { cfCdnSpaceName, cfDomainWithCdnPlanGuid } = config.env;

  await cfApi().createExternalDomain({
    domains: domain.names,
    name: serviceName,
    origin,
    path,
    cfCdnSpaceName,
    cfDomainWithCdnPlanGuid,
  });

  await domain.update({
    state: States.Provisioning,
  });

  queueProvisionStatusCheck(domain.id);

  return domain;
}

/**
 * @param {number} id The domain id
 */
async function checkDeprovisionStatus(id) {
  const domain = await Domain.findByPk(id, {
    include: [SiteBranchConfig],
  });

  if (domain.state !== Domain.States.Deprovisioning) {
    // eslint-disable-next-line max-len
    return `Domain ${id}|${domain.names} must be ${Domain.States.Deprovisioning} to be deprovisioned, but is ${domain.state}.`;
  }

  const { resources } = await cfApi().fetchServiceInstances(domain.serviceName);

  if (resources.length === 0) {
    await domain.update({
      state: States.Pending,
    });
    await module.exports.rebuildAssociatedSite(domain);
    return `Domain ${id}|${domain.names} successfully deprovisioned.`;
  }
  // TODO - this does not handle the case where deprovisioning fails
  queueDeprovisionStatusCheck(id);
  return `Domain ${id}|${domain.names} is currently deprovisioning.`;
}

/**
 * @param {number} id The domain id
 */
async function checkProvisionStatus(id) {
  const domain = await Domain.findByPk(id, {
    include: [SiteBranchConfig],
  });

  if (domain.state !== Domain.States.Provisioning) {
    // eslint-disable-next-line max-len
    return `Domain ${id}|${domain.names} must be ${Domain.States.Provisioning} to be provisioned, but is ${domain.state}.`;
  }

  const service = await cfApi().fetchServiceInstance(domain.serviceName);
  const {
    last_operation: { state: lastOperation },
  } = service;

  switch (lastOperation) {
    case 'succeeded':
      await domain.update({
        state: States.Provisioned,
      });
      await module.exports.rebuildAssociatedSite(domain);
      return `Domain ${id}|${domain.names} successfully provisioned.`;
    case 'failed':
      await domain.update({
        state: States.Failed,
      });
      throw new Error(`Domain ${id}|${domain.names} failed to provision.`);
    default:
      queueProvisionStatusCheck(id);
      return `Domain ${id}|${domain.names} is currently ${lastOperation}.`;
  }
}

module.exports.buildDnsRecords = buildDnsRecords;
module.exports.isSiteUrlManagedByDomain = isSiteUrlManagedByDomain;
module.exports.rebuildAssociatedSite = rebuildAssociatedSite;
module.exports.canProvision = canProvision;
module.exports.canDeprovision = canDeprovision;
module.exports.canDestroy = canDestroy;
module.exports.checkDeprovisionStatus = checkDeprovisionStatus;
module.exports.checkAcmeChallengeDnsRecord = checkAcmeChallengeDnsRecord;
module.exports.checkDnsRecords = checkDnsRecords;
module.exports.checkProvisionStatus = checkProvisionStatus;
module.exports.deprovision = deprovision;
module.exports.destroy = destroy;
module.exports.provision = provision;
