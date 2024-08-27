const _ = require('underscore');
const authorizer = require('../authorizers/site');
const SiteCreator = require('../services/SiteCreator');
const SiteDestroyer = require('../services/SiteDestroyer');
const SiteMembershipCreator = require('../services/SiteMembershipCreator');
const UserActionCreator = require('../services/UserActionCreator');
const EventCreator = require('../services/EventCreator');
const siteSerializer = require('../serializers/site');
const domainSerializer = require('../serializers/domain');
const buildTaskSerializer = require('../serializers/build-task');
const {
  Organization,
  Site,
  User,
  Event,
  Domain,
  SiteBranchConfig,
  SiteBuildTask,
  BuildTaskType,
  BuildTask,
} = require('../models');
const siteErrors = require('../responses/siteErrors');
const {
  ValidationError,
  validBasicAuthUsername,
  validBasicAuthPassword,
} = require('../utils/validators');
const { toInt, wrapHandlers, appMatch } = require('../utils');
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

    const sites = await Site.forUser(user).findAll({
      include: [Domain, SiteBranchConfig, SiteBuildTask],
    });

    if (!sites) {
      return res.notFound();
    }

    const siteJSON = siteSerializer.serializeMany(sites);

    return res.json(siteJSON);
  },

  async findById(req, res) {
    const {
      user,
      params: { id: siteid },
    } = req;

    const site = await fetchModelById(siteid, Site.forUser(user));

    if (!site) {
      return res.notFound();
    }

    await authorizer.findOne(user, site);

    const siteJSON = siteSerializer.serializeNew(site);
    return res.json(siteJSON);
  },

  async destroy(req, res) {
    const {
      user,
      params: { id: siteId },
    } = req;

    const site = await fetchModelById(siteId, Site.forUser(user));

    if (!site) {
      return res.notFound();
    }

    await authorizer.destroy(user, site);
    const [status, message] = await SiteDestroyer.destroySite(site, user);

    if (status !== 'ok') {
      return res.unprocessableEntity({ message });
    }

    EventCreator.audit(Event.labels.USER_ACTION, req.user, 'Site Destroyed', {
      site,
    });
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
    EventCreator.audit(Event.labels.USER_ACTION, req.user, 'SiteUser Created', {
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
    await SiteMembershipCreator.revokeSiteMembership({
      user: req.user,
      site,
      userId,
    });
    EventCreator.audit(Event.labels.USER_ACTION, req.user, 'SiteUser Removed', {
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
        owner, template, organizationId, repository, engine,
      },
      user,
    } = req;

    const siteParams = {
      owner,
      template,
      organizationId: toInt(organizationId),
      repository,
      engine,
    };

    await authorizer.create(user, siteParams);
    const site = await SiteCreator.createSite({
      user,
      siteParams,
    });
    EventCreator.audit(Event.labels.USER_ACTION, req.user, 'Site Created', {
      site,
    });
    await site.reload({ include: [Organization, User] });
    const siteJSON = siteSerializer.serializeNew(site);
    return res.json(siteJSON);
  },

  async update(req, res) {
    const {
      user,
      params: { id: siteId },
      body,
    } = req;

    const site = await fetchModelById(siteId, Site.forUser(user), {
      include: [Domain, SiteBranchConfig],
    });

    if (!site) {
      return res.notFound();
    }

    await authorizer.update(user, site);

    const params = Object.assign(site, body);
    const updateParams = {
      engine: params.engine,
    };

    await site.update(updateParams);
    EventCreator.audit(Event.labels.USER_ACTION, req.user, 'Site Updated', {
      site: { ...updateParams, id: site.id },
    });

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

  async getSiteDomains(req, res) {
    const {
      user,
      params: { site_id: siteId },
    } = req;

    const site = await Site.findByPk(siteId, { include: [Domain] });

    if (!site) {
      return res.notFound();
    }

    const domains = await Domain.findAll({
      where: { siteId },
      include: [SiteBranchConfig],
    });

    await authorizer.findOne(user, site);

    const siteJSON = domainSerializer.serializeMany(domains);
    return res.json(siteJSON);
  },

  async getSiteBuildTasks(req, res) {
    const {
      user,
      params: { site_id: siteId },
    } = req;

    const site = await Site
      .findByPk(siteId, { include: [{ model: SiteBuildTask, include: [BuildTaskType] }] });

    if (!site) {
      return res.notFound();
    }

    await authorizer.findOne(user, site);

    // add app shortname as id
    const siteBuildTasks = site.SiteBuildTasks.map(sbt => ({
      id: appMatch(sbt.BuildTaskType),
      sbtId: sbt.id,
      metadata: sbt.metadata,
      branch: sbt.branch,
      name: sbt.BuildTaskType.name,
      description: sbt.BuildTaskType.description,
    }));

    return res.json(siteBuildTasks);
  },

  async updateSiteBuildTask(req, res) {
    const {
      user,
      params: { site_id: siteId, task_id: siteBuildTaskId },
      body,
    } = req;

    const { metadata } = body;

    // check Site for authorizer's sake
    const site = await Site.findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    await authorizer.findOne(user, site);

    const siteBuildTask = await SiteBuildTask.findByPk(siteBuildTaskId);

    if (!siteBuildTask) {
      return res.notFound();
    }

    await siteBuildTask.update({ metadata });

    return res.ok({});
  },

  async getSiteTasks(req, res) {
    const {
      user,
      params: { site_id: siteId },
    } = req;

    const site = await Site.findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    await authorizer.findOne(user, site);

    const tasks = await BuildTask.bySite(site.id).findAll({
      order: [['createdAt', 'desc']],
      limit: 100,
    });
    const tasksJSON = buildTaskSerializer.serializeMany(tasks);

    return res.json(tasksJSON);
  },
});
