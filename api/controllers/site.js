const _ = require('underscore');
const authorizer = require('../authorizers/site');
const SiteCreator = require('../services/SiteCreator');
const SiteDestroyer = require('../services/SiteDestroyer');
const SiteMembershipCreator = require('../services/SiteMembershipCreator');
const UserActionCreator = require('../services/UserActionCreator');
const siteSerializer = require('../serializers/site');
const {
  User, Site, Build, Event,
} = require('../models');
const siteErrors = require('../responses/siteErrors');
const EventCreator = require('../services/EventCreator');
const ProxyDataSync = require('../services/ProxyDataSync');
const {
  ValidationError,
  validBasicAuthUsername,
  validBasicAuthPassword,
} = require('../utils/validators');
const { wrapHandlers } = require('../utils');
const Features = require('../features');
const { fetchModelById } = require('../utils/queryDatabase');

const sendJSON = async (site, res) => {
  const siteJSON = await siteSerializer.serialize(site);
  return res.json(siteJSON);
};

const stripCredentials = ({ username, password }) => {
  if (validBasicAuthUsername(username) && validBasicAuthPassword(password)) {
    return { username, password };
  }

  throw new ValidationError('username or password is not valid.');
};

module.exports = wrapHandlers({
  async findAllForUser(req, res) {
    const user = await fetchModelById(req.user.id, User, { include: [Site] });
    sendJSON(user.Sites, res);
  },

  async findById(req, res) {
    const site = await fetchModelById(req.params.id, Site);
    if (!site) {
      throw 404;
    }
    await authorizer.findOne(req.user, site);
    const siteJSON = await siteSerializer.serialize(site);
    res.json(siteJSON);
  },

  async destroy(req, res) {
    const { id } = req.params;
    const site = await fetchModelById(id, Site);
    const siteJSON = await siteSerializer.serialize(site);
    await authorizer.destroy(req.user, site);
    await SiteDestroyer.destroySite(site);
    return res.json(siteJSON);
  },

  async addUser(req, res) {
    const { body, user } = req;
    if (!body.owner || !body.repository) {
      throw 400;
    }

    await authorizer.addUser(user, body);
    const site = await SiteMembershipCreator.createSiteMembership({
      user,
      siteParams: body,
    });
    const siteJSON = await siteSerializer.serialize(site);
    res.json(siteJSON);
  },

  async removeUser(req, res) {
    const siteId = Number(req.params.site_id);
    const userId = Number(req.params.user_id);

    if (_.isNaN(siteId) || _.isNaN(userId)) {
      throw 400;
    }

    const site = await Site.withUsers(siteId);
    if (!site) {
      throw 404;
    }

    if (site.Users.length === 1) {
      throw {
        status: 400,
        message: siteErrors.USER_REQUIRED,
      };
    }
    await authorizer.removeUser(req.user, site);
    await SiteMembershipCreator.revokeSiteMembership({ user: req.user, site, userId });
    await UserActionCreator.addRemoveAction({
      userId: req.user.id,
      targetId: userId,
      targetType: 'user',
      siteId: site.id,
    });
    sendJSON(site, res);
  },

  async create(req, res) {
    const { body, user } = req;
    const siteParams = { ...body, sharedBucket: false };

    await authorizer.create(user, siteParams);
    const site = await SiteCreator.createSite({
      user,
      siteParams,
    });

    if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
      ProxyDataSync.saveSite(site)
        .catch(err => EventCreator.handlerError(req, err));
    }
    const siteJSON = await siteSerializer.serialize(site);
    res.json(siteJSON);
  },

  async update(req, res) {
    let build;

    const site = await fetchModelById(req.params.id, Site);
    if (!site) {
      throw 404;
    }
    await authorizer.update(req.user, site);
    const params = Object.assign(site, req.body);
    await site.update({
      demoBranch: params.demoBranch,
      demoDomain: params.demoDomain,
      defaultConfig: params.defaultConfig,
      previewConfig: params.previewConfig,
      demoConfig: params.demoConfig,
      defaultBranch: params.defaultBranch,
      domain: params.domain,
      engine: params.engine,
    });
    build = await Build.create({
      user: req.user.id,
      site: site.id,
      branch: site.defaultBranch,
      username: req.user.username,
    });
    await build.enqueue();
    if (site.demoBranch) {
      build = await Build.create({
        user: req.user.id,
        site: site.id,
        branch: site.demoBranch,
        username: req.user.username,
      });
      await build.enqueue();
    }
    const siteJSON = await siteSerializer.serialize(site);
    res.json(siteJSON);
  },

  async addBasicAuth(req, res) {
    const { body, params, user } = req;

    const { site_id: siteId } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    const credentials = stripCredentials(body);

    await site.update({ basicAuth: credentials });

    if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
      ProxyDataSync.saveSite(site) // sync to proxy database
        .catch(err => EventCreator.handlerError(req, err));
    }

    const siteJSON = await siteSerializer.serialize(site);
    return res.json(siteJSON);
  },

  async removeBasicAuth(req, res) {
    const { params, user } = req;
    const { site_id: siteId } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    await site.update({ basicAuth: {} });

    if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
      ProxyDataSync.saveSite(site) // sync to proxy database
        .catch(err => EventCreator.handlerError(req, error));
    }

    const siteJSON = await siteSerializer.serialize(site);
    return res.json(siteJSON);
  },
});
