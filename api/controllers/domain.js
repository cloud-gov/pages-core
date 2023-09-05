const _ = require('underscore');
const EventCreator = require('../services/EventCreator');
const domainSerializer = require('../serializers/domain');
const { wrapHandlers } = require('../utils');
const { siteViewOrigin } = require('../utils/site');
const {
  Domain, Event, Site, SiteBranchConfig,
} = require('../models');

module.exports = wrapHandlers({
  async create(req, res) {
    const {
      params,
      body: { names, siteBranchConfigId },
      user,
    } = req;
    const siteId = parseInt(params.site_id, 10);
    const sbcId = parseInt(siteBranchConfigId, 10);

    const site = await Site.forUser(user).findByPk(siteId, {
      include: [Domain, SiteBranchConfig],
    });

    if (!site) {
      return res.notFound();
    }

    const existingDomain = site.Domains.find(
      d => d.names === names || d.siteBranchConfigId === sbcId
    );

    if (existingDomain?.names === names) {
      return res.badRequest({
        message: 'A domain with the same name already exists for the site.',
      });
    }

    if (existingDomain?.siteBranchConfigId === sbcId) {
      return res.badRequest({
        message:
          'A domain with the same branch config already exists for the site.',
      });
    }

    const siteBranchConfig = site.SiteBranchConfigs.find(
      sbc => sbc.id === sbcId
    );

    if (!siteBranchConfig) {
      return res.badRequest({
        message:
          'The site branch config specified for the domain does not exist.',
      });
    }

    if (siteBranchConfig?.context === 'preview') {
      return res.badRequest({
        message:
          'The domain site branch config cannot have the context of "preview".',
      });
    }

    try {
      const origin = siteViewOrigin(site);
      const firstDomainName = names.split(',')[0];
      const serviceName = `${firstDomainName}-ext`;
      const domain = await Domain.create({
        siteId,
        siteBranchConfigId: sbcId,
        names,
        origin,
        path: siteBranchConfig.s3Key,
        serviceName,
      });
      EventCreator.audit(Event.labels.SITE_USER, user, 'Domain Created', {
        domain,
      });
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
  async delete(req, res) {
    const { params, user } = req;
    const siteId = parseInt(params.site_id, 10);
    const domainId = parseInt(params.domain_id, 10);

    const site = await Site.forUser(user).findByPk(siteId, {
      include: [Domain],
    });

    if (!site) {
      return res.notFound();
    }

    const domain = site.Domains.find(d => d.id === domainId);

    if (!domain) {
      return res.notFound();
    }

    if (domain.state !== 'pending') {
      return res.badRequest({
        message: `
          The domain cannot be deleted because it is ${domain.state}.
          Please contact cloud.gov Pages support.
        `,
      });
    }

    try {
      await domain.destroy();
      EventCreator.audit(Event.labels.SITE_USER, user, 'Domain Created', {
        domain,
      });
      return res.json({ message: 'Success' });
    } catch (error) {
      if (!error.errors) {
        throw error;
      }
      const errors = error.errors.reduce(
        (obj, err) => ({
          ...obj,
          [err.path]: err.message,
        }),
        {}
      );

      return res.unprocessableEntity({
        errors,
        message: 'Could not delete Domain',
      });
    }
  },
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async update(req, res) {
    const { params, body, user } = req;
    const siteId = parseInt(params.site_id, 10);
    const domainId = parseInt(params.domain_id, 10);
    const siteBranchConfigId = parseInt(body.siteBranchConfigId, 10);
    const { names } = body;

    const site = await Site.forUser(user).findByPk(siteId, {
      include: [Domain, SiteBranchConfig],
    });

    if (!site) {
      return res.notFound();
    }

    const domain = site.Domains.find(d => d.id === domainId);

    if (!domain) {
      return res.notFound();
    }

    if (domain.state !== 'pending') {
      return res.badRequest({
        message: `
          The domain cannot be updated because it is ${domain.state}.
          Please contact cloud.gov Pages support.
        `,
      });
    }

    const payload = _.omit(
      {
        siteBranchConfigId,
        names,
      },
      x => !x
    );

    if (payload.siteBranchConfigId) {
      const siteBranchConfig = site.SiteBranchConfigs.find(
        sbc => sbc.id === payload.siteBranchConfigId
      );

      if (!siteBranchConfig) {
        return res.badRequest({
          message:
            'The site branch config specified for the domain does not exist.',
        });
      }

      if (siteBranchConfig?.context === 'preview') {
        return res.badRequest({
          message:
            'The domain site branch config cannot have the context of "preview".',
        });
      }

      const existingDomain = site.Domains.find(
        d => d.siteBranchConfigId === payload.siteBranchConfigId
          && d.id !== domainId
      );

      if (existingDomain) {
        return res.badRequest({
          message:
            'A domain with the same branch config already exists for the site.',
        });
      }
    }

    if (payload.names) {
      const existingDomain = site.Domains.find(
        d => d.names === payload.names && d.id !== domainId
      );

      if (existingDomain) {
        return res.badRequest({
          message: 'A domain with the same name already exists for the site.',
        });
      }
    }

    try {
      domain.set(payload);
      const updated = await domain.save();
      EventCreator.audit(Event.labels.SITE_USER, user, 'Domain Updated', {
        updated,
      });
      return res.json(domainSerializer.serialize(updated, true));
    } catch (error) {
      if (!error.errors) {
        throw error;
      }
      const errors = error.errors.reduce(
        (obj, err) => ({
          ...obj,
          [err.path]: err.message,
        }),
        {}
      );

      return res.unprocessableEntity({
        errors,
        message: 'Could not update Domain',
      });
    }
  },
});
