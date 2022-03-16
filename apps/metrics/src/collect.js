const CloudFoundryClient = require('../lib/cfApiClient');

/**
 * @param {number} timestamp - time in milliseconds
 * @param {object} [options]
 * @param {CloudFoundryClient} [options.cfClient] - a Cloud Foundry Client instance
 */
async function collect(timestamp, { cfClient } = {}) {
  const cf = cfClient ?? new CloudFoundryClient();

  const org = await cf.fetchOrganizationByName('gsa-18f-federalist');

  /**
   * @type {import('../lib/newRelicClient').Metric[]}
   */
  const metrics = await Promise.all([
    cf.fetchUsageSummary(org.guid)
      .then(usageSummary => [
        {
          name: 'pages.memory.org',
          type: 'gauge',
          value: usageSummary.memory_in_mb,
          timestamp,
        },
        {
          name: 'pages.instances.org',
          type: 'gauge',
          value: usageSummary.started_instances,
          timestamp,
        },
      ]),
    cf.fetchOrganizationQuota(org.relationships.quota.data.guid)
      .then(quota => ({
        name: 'pages.quota.org',
        type: 'gauge',
        value: quota.apps.total_memory_in_mb,
        timestamp,
      })),
    cf.fetchSpaces(org.guid)
      .then(res => res.resources
        .filter(r => r.relationships.quota.data === null)
        .length)
      .then(numSpacesWithoutQuota => ({
        name: 'pages.missingQuotas.org',
        type: 'gauge',
        value: numSpacesWithoutQuota,
        timestamp,
      })),
  ]);

  return metrics.flat();
}

module.exports = collect;
