const IORedis = require('ioredis');
const { Op } = require('sequelize');
const { sequelize, Domain, Site, SiteBranchConfig } = require('../models');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const { DomainQueue } = require('../queues');
const config = require('../../config');
const { siteViewOrigin } = require('../utils/site');
const { CustomError } = require('../utils/validators');
const SourceCodePlatformHelper = require('./SourceCodePlatformHelper');

const DnsService = require('./Dns');
const { BuildService } = require('./build');

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
 * @returns {boolean}
 */
function canMigrate(domain) {
  return domain.state === States.Provisioned && !!domain.serviceName;
}

/**
 * @param {DomainModel} domain The domain to migrate
 * @returns {Promise<SiteBranchConfigModel[]>}
 */
function findMigrationCandidates(domain) {
  return SiteBranchConfig.findAll({
    where: {
      context: Domain.Contexts.values,
    },
    include: [
      {
        model: Site,
        required: true,
        where: {
          id: {
            [Op.ne]: domain.siteId,
          },
        },
      },
      {
        model: Domain,
        required: false,
      },
    ],
    order: [
      [Site, 'owner', 'ASC'],
      [Site, 'repository', 'ASC'],
      ['context', 'ASC'],
    ],
  }).then((candidates) =>
    candidates.filter(
      (candidate) =>
        candidate.Domains.length === 0 ||
        candidate.Domains.some(
          (target) => target.state === States.Pending && target.names === domain.names,
        ),
    ),
  );
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
async function rebuildAssociatedSite(domain, flow) {
  const { branch } = domain.SiteBranchConfig;
  if (branch) {
    const build = await BuildService.createBuild(
      {
        site: domain.siteId,
        branch,
        username: 'Automated Platform Operation',
      },
      flow,
    );
    await build.enqueue();
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
 * @typedef {object} MigrationResult
 * @prop {DomainModel} source The domain that was migrated from (now deleted)
 * @prop {DomainModel} target The domain that was migrated to (now provisioned)
 */

/**
 *
 * @param {DomainModel} domain The provisioned domain to migrate from.
 * @param {SiteBranchConfigModel} targetSbc The destination branch config.
 * @returns {Promise<MigrationResult>}
 */
async function migrate(domain, targetSbc) {
  if (!canMigrate(domain)) {
    throw new CustomError(
      // eslint-disable-next-line max-len
      `Only '${States.Provisioned}' domains with an external domain service can be migrated.`,
      400,
    );
  }

  if (!targetSbc) {
    throw new CustomError('A site branch config to migrate to must be provided.', 400);
  }

  if (targetSbc.siteId === domain.siteId) {
    throw new CustomError(
      'Domains can only be migrated to a domain on a different site.',
      400,
    );
  }

  const { Site: targetSite } = targetSbc;

  if (!targetSite) {
    throw new CustomError(
      'The site branch config being migrated to must be loaded with its site.',
      400,
    );
  }

  if (targetSbc.context === 'preview') {
    throw new CustomError(
      // eslint-disable-next-line max-len
      'The domain being migrated to cannot have a site branch config with the context of "preview".',
      400,
    );
  }

  const origin = siteViewOrigin(targetSite);
  const { s3Key: path } = targetSbc;

  if (!path) {
    throw new CustomError(
      // eslint-disable-next-line max-len
      `The site branch config ${targetSbc.id} for the domain being migrated to does not have an s3Key.`,
      400,
    );
  }

  const { serviceName } = domain;
  let targetDomain = await Domain.findOne({
    where: {
      names: domain.names,
      siteBranchConfigId: targetSbc.id,
      siteId: targetSite.id,
      state: States.Pending,
    },
  });

  if (!targetDomain) {
    const existingTargetDomain = await Domain.findOne({
      where: {
        siteBranchConfigId: targetSbc.id,
        siteId: targetSite.id,
      },
    });

    if (existingTargetDomain) {
      throw new CustomError(
        'The selected site branch configuration already has a custom domain.',
        400,
      );
    }
  }
  const targetWasCreated = !targetDomain;

  const previousTarget = targetWasCreated
    ? null
    : {
        origin: targetDomain.origin,
        path: targetDomain.path,
        serviceName: targetDomain.serviceName,
        state: targetDomain.state,
      };

  await sequelize.transaction(async (transaction) => {
    if (targetWasCreated) {
      targetDomain = await Domain.create(
        {
          context: targetSbc.context,
          names: domain.names,
          origin,
          path,
          serviceName,
          siteBranchConfigId: targetSbc.id,
          siteId: targetSite.id,
          state: States.Provisioned,
        },
        { transaction },
      );
    } else {
      await targetDomain.update(
        {
          serviceName,
          origin,
          path,
          state: States.Provisioned,
        },
        { transaction },
      );
    }

    await domain.update(
      {
        state: States.Pending,
        serviceName: null,
      },
      { transaction },
    );

    await domain.destroy({ transaction });
  });

  try {
    await cfApi().updateExternalDomain({
      name: serviceName,
      origin,
      path,
    });
  } catch (error) {
    await sequelize.transaction(async (transaction) => {
      if (targetWasCreated) {
        await targetDomain.destroy({ force: true, transaction });
      } else {
        await targetDomain.update(previousTarget, { transaction });
      }

      await domain.restore({ transaction });
      await domain.update(
        {
          state: States.Provisioned,
          serviceName,
        },
        { transaction },
      );
    });

    if (
      error.errors?.some(
        (cfError) =>
          Number(cfError.code) === 60016 ||
          cfError.title === 'CF-AsyncServiceInstanceOperationInProgress',
      )
    ) {
      throw new CustomError(
        'Cloud Foundry is still processing the previous service update. ' +
          'Wait for it to finish, then try migrating again. ' +
          'This migration was not applied.',
        400,
      );
    }

    throw error;
  }
  //Trigger site rebuild
  targetDomain.SiteBranchConfig = targetSbc;
  await module.exports.rebuildAssociatedSite(
    targetDomain,
    SourceCodePlatformHelper.flows.FLOW__ADMIN_REBUILD,
  );

  return {
    source: domain,
    target: targetDomain,
  };
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
    await module.exports.rebuildAssociatedSite(
      domain,
      SourceCodePlatformHelper.flows.FLOW__DOMAIN_DEPROV,
    );
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
      await module.exports.rebuildAssociatedSite(
        domain,
        SourceCodePlatformHelper.flows.FLOW____DOMAIN_PROV,
      );
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
module.exports.canMigrate = canMigrate;
module.exports.checkDeprovisionStatus = checkDeprovisionStatus;
module.exports.checkAcmeChallengeDnsRecord = checkAcmeChallengeDnsRecord;
module.exports.checkDnsRecords = checkDnsRecords;
module.exports.checkProvisionStatus = checkProvisionStatus;
module.exports.deprovision = deprovision;
module.exports.destroy = destroy;
module.exports.findMigrationCandidates = findMigrationCandidates;
module.exports.migrate = migrate;
module.exports.provision = provision;
