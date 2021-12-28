const _ = require('underscore');
const authorizer = require('../authorizers/site');
const SiteCreator = require('../services/SiteCreator');
const SiteDestroyer = require('../services/SiteDestroyer');
const SiteMembershipCreator = require('../services/SiteMembershipCreator');
const UserActionCreator = require('../services/UserActionCreator');
const EventCreator = require('../services/EventCreator');
const siteSerializer = require('../serializers/site');
const {
  Build, Organization, Site, User, Event, Domain,
} = require('../models');
const siteErrors = require('../responses/siteErrors');
const {
  ValidationError,
  validBasicAuthUsername,
  validBasicAuthPassword,
} = require('../utils/validators');
const { toInt, wrapHandlers } = require('../utils');
const { fetchModelById } = require('../utils/queryDatabase');

const stripCredentials = ({ username, password }) => {
  if (validBasicAuthUsername(username) && validBasicAuthPassword(password)) {
    return { username, password };
  }

  throw new ValidationError('username or password is not valid.');
};

module.exports = wrapHandlers({
  async findAllForUser(req, res) {
    const { user } = req;

    const sites = await Site.forUser(user).findAll({ include: [Domain] });

    if (!sites) {
      return res.notFound();
    }

    const siteJSON = siteSerializer.serializeMany(sites);

    return res.json(siteJSON);
  },

  async findById(req, res) {
    const { user, params: { id: siteid } } = req;

    const site = await fetchModelById(siteid, Site.forUser(user));

    if (!site) {
      return res.notFound();
    }

    await authorizer.findOne(user, site);

    const siteJSON = siteSerializer.serializeNew(site);
    return res.json(siteJSON);
  },

  async destroy(req, res) {
    const { user, params: { id: siteId } } = req;

    const site = await fetchModelById(siteId, Site.forUser(user));

    if (!site) {
      return res.notFound();
    }

    await authorizer.destroy(user, site);
    await SiteDestroyer.destroySite(site, user);
    EventCreator.audit(req.user, Event.labels.USER_ACTION, 'Site Destroyed', { site });
    return res.json({});
  },

  async addUser(req, res) {
    const { body, user } = req;
    if (!body.owner || !body.repository) {
      return res.badRequest();
    }

    await authorizer.addUser(user, body);
    const site = await SiteMembershipCreator.createSiteMembership({
      user,
      siteParams: body,
    });
    EventCreator.audit(req.user, Event.labels.USER_ACTION, 'SiteUser Created', {
      siteUser: { siteId: site.id, userId: user.id },
    });
    const siteJSON = await siteSerializer.serialize(site);
    return res.json(siteJSON);
  },

  async removeUser(req, res) {
    const siteId = Number(req.params.site_id);
    const userId = Number(req.params.user_id);

    if (_.isNaN(siteId) || _.isNaN(userId)) {
      return res.badRequest();
    }

    const site = await Site.withUsers(siteId);
    if (!site) {
      return res.notFound();
    }

    if (site.Users.length === 1) {
      return res.badRequest({ message: siteErrors.USER_REQUIRED });
    }

    await authorizer.removeUser(req.user, site);
    await SiteMembershipCreator.revokeSiteMembership({ user: req.user, site, userId });
    EventCreator.audit(req.user, Event.labels.USER_ACTION, 'SiteUser Removed', {
      siteUser: { siteId: site.id, userId },
    });
    // UserActionCreator to be deleted
    await UserActionCreator.addRemoveAction({
      userId: req.user.id,
      targetId: userId,
      targetType: 'user',
      siteId: site.id,
    });
    const siteJSON = await siteSerializer.serialize(site);
    return res.json(siteJSON);
  },

  async create(req, res) {
    const {
      body: {
        owner, template, organizationId, repository,
      },
      user,
    } = req;

    const siteParams = {
      owner,
      template,
      organizationId: toInt(organizationId),
      repository,
      sharedBucket: false,
    };

    await authorizer.create(user, siteParams);
    const site = await SiteCreator.createSite({
      user,
      siteParams,
    });
    EventCreator.audit(req.user, Event.labels.USER_ACTION, 'Site Created', { site });
    await site.reload({ include: [Organization, User] });
    const siteJSON = siteSerializer.serializeNew(site);
    return res.json(siteJSON);
  },

  async update(req, res) {
    const { user, params: { id: siteId }, body } = req;

    const site = await fetchModelById(siteId, Site.forUser(user));

    if (!site) {
      return res.notFound();
    }

    await authorizer.update(user, site);

    const params = Object.assign(site, body);
    const updateParams = {
      demoBranch: params.demoBranch,
      demoDomain: params.demoDomain,
      defaultConfig: params.defaultConfig,
      previewConfig: params.previewConfig,
      demoConfig: params.demoConfig,
      defaultBranch: params.defaultBranch,
      domain: params.domain,
      engine: params.engine,
    };
    await site.update(updateParams);
    EventCreator.audit(req.user, Event.labels.USER_ACTION, 'Site Updated', {
      site: { ...updateParams, id: site.id },
    });
    await Build.create({
      user: req.user.id,
      site: site.id,
      branch: site.defaultBranch,
      username: req.user.username,
    })
      .then(b => b.enqueue());

    if (site.demoBranch) {
      await Build.create({
        user: req.user.id,
        site: site.id,
        branch: site.demoBranch,
        username: req.user.username,
      })
        .then(b => b.enqueue());
    }

    const siteJSON = siteSerializer.serializeNew(site);
    return res.json(siteJSON);
  },

  async addBasicAuth(req, res) {
    const { body, params, user } = req;

    const { site_id: siteId } = params;

    const site = await fetchModelById(siteId, Site.forUser(user));

    if (!site) {
      return res.notFound();
    }

    const credentials = stripCredentials(body);

    await site.update({ basicAuth: credentials });

    const siteJSON = siteSerializer.serializeNew(site);
    return res.json(siteJSON);
  },

  async removeBasicAuth(req, res) {
    const { params, user } = req;
    const { site_id: siteId } = params;

    const site = await fetchModelById(siteId, Site.forUser(user));

    if (!site) {
      return res.notFound();
    }

    await site.update({ basicAuth: {} });

    const siteJSON = siteSerializer.serializeNew(site);
    return res.json(siteJSON);
  },
});
