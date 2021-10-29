const { Domain, Site } = require('../../models');
const { fetchModelById } = require('../../utils/queryDatabase');
const { paginate, wrapHandlers } = require('../../utils');
const DomainService = require('../../services/Domain');
const domainSerializer = require('../../serializers/domain');

module.exports = wrapHandlers({
  async list(req, res) {
    const {
      limit, page, search, site,
    } = req.query;

    const scopes = ['withSite'];

    if (search) {
      scopes.push(Domain.searchScope(search));
    }

    if (site) {
      scopes.push(Domain.siteScope(site));
    }

    const [pagination, sites] = await Promise.all([
      paginate(
        Domain.scope(scopes),
        domains => domainSerializer.serializeMany(domains, true),
        { limit, page },
        { order: ['names', 'context'] }
      ),
      Site.findAll({ attributes: ['id', 'owner', 'repository', 'demoBranch'], raw: true }),
    ]);

    const json = {
      meta: { sites },
      ...pagination,
    };

    return res.json(json);
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
      body: {
        context,
        names,
        siteId,
      },
    } = req;

    const site = await fetchModelById(siteId, Site);
    if (!site) {
      return res.notFound();
    }

    try {
      const domain = await Domain.create({ siteId, context, names });
      return res.json(domainSerializer.serialize(domain, true));
    } catch (err) {
      if (!err.errors) {
        throw err;
      }
      const errors = err.errors.reduce((obj, error) => ({
        ...obj, [error.path]: error.message,
      }), {});

      return res.unprocessableEntity({ errors, message: 'Could not create Domain' });
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

    return res.json({
      canProvision,
      data: dnsResults,
    });
  },

  async deprovision(req, res) {
    const {
      params: { id },
    } = req;

    const domain = await fetchModelById(id, Domain);
    if (!domain) {
      return res.notFound();
    }

    try {
      const updatedDomain = await DomainService.deprovision(domain);
      return res.json(domainSerializer.serialize(updatedDomain, true));
    } catch (error) {
      return res.unprocessableEntity(error);
    }
  },

  async provision(req, res) {
    const {
      params: { id },
    } = req;

    const domain = await fetchModelById(id, Domain);
    if (!domain) {
      return res.notFound();
    }

    const dnsResults = await DomainService.checkAcmeChallengeDnsRecord(domain);

    try {
      const updatedDomain = await DomainService.provision(domain, dnsResults);
      return res.json(domainSerializer.serialize(updatedDomain, true));
    } catch (error) {
      return res.unprocessableEntity(error);
    }
  },
});