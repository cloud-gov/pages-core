const tap = require('tap');

const collect = require('../src/collect');

tap.test('It collects the metrics!', async (t) => {
  const org = {
    guid: 'org-guid',
    relationships: {
      quota: {
        data: {
          guid: 'quota-guid',
        },
      },
    },
  };

  const cfClient = {
    async fetchOrganizationByName(orgName) {
      t.same(orgName, 'gsa-18f-federalist', `Metrics collected for org: ${orgName}.`);
      return org;
    },

    async fetchUsageSummary(orgGuid) {
      t.same(orgGuid, org.guid, 'Usage summary collected for the correct org.');
      return {
        memory_in_mb: 12,
        started_instances: 2,
      };
    },

    async fetchOrganizationQuota(quotaGuid) {
      t.same(quotaGuid, org.relationships.quota.data.guid, 'Quota collected for the correct org.');
      return {
        apps: {
          total_memory_in_mb: 40,
        },
      };
    },

    async fetchSpaces(orgGuid) {
      t.same(orgGuid, org.guid, 'Spaces collected for the correct org.');
      return {
        resources: [
          {
            relationships: {
              quota: {
                data: null,
              }
            }
          },
          {
            relationships: {
              quota: {
                data: {
                  guid: 'abc1234',
                }
              }
            }
          },
          {
            relationships: {
              quota: {
                data: {
                  guid: 'abc1234',
                }
              }
            }
          },          
        ]
      };
    }
  };

  const timestamp = Date.now();

  const expectedMetrics = [
    {
      name: 'pages.memory.org',
      type: 'gauge',
      value: 12,
      timestamp,
    },
    {
      name: 'pages.instances.org',
      type: 'gauge',
      value: 2,
      timestamp,
    },
    {
      name: 'pages.quota.org',
      type: 'gauge',
      value: 40,
      timestamp,
    },
    {
      name: 'pages.missingQuotas.org',
      type: 'gauge',
      value: 1,
      timestamp,
    },
  ];

  const metrics = await collect(timestamp, { cfClient });

  t.same(metrics, expectedMetrics, 'Expected metrics collected.');
});
