const json2csv = require('@json2csv/plainjs');
const {
  Domain,
  Event,
  Organization,
  Site,
  SiteBranchConfig,
} = require('../../models');
const { fetchModelById } = require('../../utils/queryDatabase');
const { paginate, wrapHandlers } = require('../../utils');
const { siteViewOrigin } = require('../../utils/site');
const DomainService = require('../../services/Domain');
const EventCreator = require('../../services/EventCreator');
const domainSerializer = require('../../serializers/domain');

module.exports = wrapHandlers({
  async list(req, res) {
    const {
      limit, page, search, site, state,
    } = req.query;

    const scopes = ['withSite'];

    if (search) {
      scopes.push(Domain.searchScope(search));
    }

    if (site) {
      scopes.push(Domain.siteScope(site));
    }

    if (state) {
      scopes.push(Domain.stateScope(state));
    }

    const [pagination, sites] = await Promise.all([
      paginate(
        Domain.scope(scopes),
        domains => domainSerializer.serializeMany(domains, true),
        { limit, page },
        { order: ['names', 'context'] }
      ),
      Site.findAll({
        attributes: ['id', 'owner', 'repository', 'demoBranch'],
        raw: true,
      }),
    ]);

    const json = {
      meta: {
        sites,
        states: Domain.States.values,
      },
      ...pagination,
    };

    return res.json(json);
  },

  async listPublished(req, res) {
    const { limit, page, organization } = req.query;

    const scopes = ['provisionedWithSiteAndOrganization'];

    if (organization) {
      scopes.push(Domain.orgScope(organization));
    }

    const [pagination, orgs] = await Promise.all([
      paginate(
        Domain.scope(scopes),
        domains => domainSerializer.serializeMany(domains, true),
        { limit, page },
        { order: ['names', 'context'] }
      ),
      Organization.findAll({ raw: true }),
    ]);

    const json = {
      meta: {
        orgs,
      },
      ...pagination,
    };

    return res.json(json);
  },

  async listPublishedCSV(req, res) {
    const domains = await Domain.scope(
      'provisionedWithSiteAndOrganization'
    ).findAll();

    const fields = [
      {
        label: 'Organization',
        value: 'Site.Organization.name',
      },
      {
        label: 'Agency',
        value: 'Site.Organization.agency',
      },
      {
        label: 'Site',
        value: 'Site.repository',
      },
      {
        label: 'Domain',
        value: 'names',
      },
      {
        label: 'Engine',
        value: 'Site.engine',
      },
    ];

    const parser = new json2csv.Parser({ fields });
    const csv = parser.parse(domains);
    res.attachment('organizations-report.csv');
    return res.send(csv);
  },

  async findById(req, res) {
    const {
      params: { id },
    } = req;

    const domain = await fetchModelById(id, Domain.scope('withSite'));
    if (!domain) {
      return res.notFound();
    }

    const dnsRecords = DomainService.buildDnsRecords(domain);

    return res.json({
      dnsRecords,
      domain: domainSerializer.serialize(domain, true),
    });
  },

  async create(req, res) {
    const {
      body: { names, siteBranchConfigId, siteId },
    } = req;

    const site = await fetchModelById(siteId, Site);
    if (!site) {
      return res.notFound();
    }

    const sbc = await fetchModelById(siteBranchConfigId, SiteBranchConfig);
    if (!sbc) {
      return res.notFound();
    }

    if (sbc.siteId !== siteId) {
      return res
        .status(400)
        .send({ message: 'The site and site branch config are not related.' });
    }

    if (sbc.context === 'preview') {
      return res.status(400).send({
        message: 'The site branch config cannot have the context of "preview".',
      });
    }

    try {
      const origin = siteViewOrigin(site);
      const firstDomainName = names.split(',')[0];
      const serviceName = `${firstDomainName}-ext`;
      const domain = await Domain.create({
        siteId,
        siteBranchConfigId,
        names,
        origin,
        path: sbc.s3Key,
        serviceName,
      });
      EventCreator.audit(
        Event.labels.ADMIN_ACTION,
        req.user,
        'Domain Created',
        { domain }
      );
      return res.json(domainSerializer.serialize(domain, true));
    } catch (err) {
      if (!err.errors) {
        throw err;
      }
      const errors = err.errors.reduce(
        (obj, error) => ({
          ...obj,
          [error.path]: error.message,
        }),
        {}
      );

      return res.unprocessableEntity({
        errors,
        message: 'Could not create Domain',
      });
    }
  },

  async destroy(req, res) {
    const {
      params: { id },
    } = req;

    const domain = await fetchModelById(id, Domain);
    if (!domain) {
      return res.notFound();
    }

    try {
      await DomainService.destroy(domain);
      EventCreator.audit(
        Event.labels.ADMIN_ACTION,
        req.user,
        'Domain Destroyed',
        { domain }
      );
      return res.json({});
    } catch (error) {
      return res.unprocessableEntity(error);
    }
  },

  async dns(req, res) {
    const {
      params: { id },
    } = req;

    const domain = await fetchModelById(id, Domain);
    if (!domain) {
      return res.notFound();
    }

    const dnsRecords = DomainService.buildDnsRecords(domain);

    return res.json(dnsRecords);
  },

  async dnsResult(req, res) {
    const {
      params: { id },
    } = req;

    const domain = await fetchModelById(id, Domain);
    if (!domain) {
      return res.notFound();
    }

    const dnsResults = await DomainService.checkDnsRecords(domain);

    const canProvision = DomainService.canProvision(domain, dnsResults);

    const canDeprovision = DomainService.canDeprovision(domain);

    const canDestroy = DomainService.canDestroy(domain);

    return res.json({
      canProvision,
      canDeprovision,
      canDestroy,
      data: dnsResults,
    });
  },

  async deprovision(req, res) {
    const {
      params: { id },
    } = req;

    const domain = await fetchModelById(id, Domain.scope('withSite'));
    if (!domain) {
      return res.notFound();
    }

    try {
      const updatedDomain = await DomainService.deprovision(domain);
      EventCreator.audit(
        Event.labels.ADMIN_ACTION,
        req.user,
        'Domain Deprovisioned',
        { domain: updatedDomain }
      );
      return res.json({
        dnsRecords: DomainService.buildDnsRecords(updatedDomain),
        domain: domainSerializer.serialize(updatedDomain, true),
      });
    } catch (error) {
      return res.unprocessableEntity(error);
    }
  },

  async provision(req, res) {
    const {
      params: { id },
    } = req;

    const domain = await fetchModelById(id, Domain.scope('withSite'));
    if (!domain) {
      return res.notFound();
    }

    const dnsResults = await DomainService.checkAcmeChallengeDnsRecord(domain);

    try {
      const updatedDomain = await DomainService.provision(domain, dnsResults);
      EventCreator.audit(
        Event.labels.ADMIN_ACTION,
        req.user,
        'Domain Provisioned',
        { domain: updatedDomain }
      );
      return res.json({
        dnsRecords: DomainService.buildDnsRecords(updatedDomain),
        domain: domainSerializer.serialize(updatedDomain, true),
      });
    } catch (error) {
      return res.unprocessableEntity(error);
    }
  },
});
