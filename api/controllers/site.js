const _ = require('underscore');
const authorizer = require('../authorizers/site');
const SiteCreator = require('../services/SiteCreator');
const SiteDestroyer = require('../services/SiteDestroyer');
const SiteMembershipCreator = require('../services/SiteMembershipCreator');
const UserActionCreator = require('../services/UserActionCreator');
const siteSerializer = require('../serializers/site');
const { User, Site, Build, Event } = require('../models');
const siteErrors = require('../responses/siteErrors');
const EventCreator = require('../services/EventCreator');
const ProxyDataSync = require('../services/ProxyDataSync');
const {
  ValidationError,
  validBasicAuthUsername,
  validBasicAuthPassword,
} = require('../utils/validators');
const { wrapHandler } = require('../utils');
const Features = require('../features');
const { fetchModelById } = require('../utils/queryDatabase');

const sendJSON = (site, res) => siteSerializer
  .serialize(site)
  .then(siteJSON => res.json(siteJSON));

const stripCredentials = ({ username, password }) => {
  if (validBasicAuthUsername(username) && validBasicAuthPassword(password)) {
    return { username, password };
  }

  throw new ValidationError('username or password is not valid.');
};

module.exports = {
  findAllForUser: (req, res) => {
    User.findByPk(req.user.id, { include: [Site] })
      .then(user => sendJSON(user.Sites, res))
      .catch((err) => {
        res.error(err);
      });
  },

  findById: (req, res) => {
    let site;

    Promise.resolve(Number(req.params.id)).then((id) => {
      if (_.isNaN(id)) {
        throw 404;
      }
      return Site.findByPk(id);
    })
      .then((model) => {
        if (model) {
          site = model;
        } else {
          throw 404;
        }
        return authorizer.findOne(req.user, site);
      })
      .then(() => siteSerializer.serialize(site))
      .then((siteJSON) => {
        res.json(siteJSON);
      })
      .catch((err) => {
        res.error(err);
      });
  },

  destroy: async (req, res) => {
    const { id } = req.params;

    try {
      const site = await fetchModelById(id, Site);
      const siteJSON = await siteSerializer.serialize(site);
      await authorizer.destroy(req.user, site);
      await SiteDestroyer.destroySite(site);
      return res.json(siteJSON);
    } catch (err) {
      const errBody = {
        message: 'Error encountered when destroying site',
        error: err.stack,
        request: {
          params: req.params,
          path: req.path,
        }
      };
      EventCreator.error(Event.labels.SITE_DESTROY, errBody);
      return res.error(err);
    }
  },

  addUser: (req, res) => {
    const { body, user } = req;
    if (!body.owner || !body.repository) {
      res.error(400);
      return;
    }

    authorizer.addUser(user, body)
      .then(() => SiteMembershipCreator.createSiteMembership({
        user,
        siteParams: body,
      }))
      .then(site => siteSerializer.serialize(site))
      .then((siteJSON) => {
        res.json(siteJSON);
      })
      .catch((err) => {
        const errBody = {
          message: 'Error encountered when adding user to site',
          error: err.stack,
          request: {
            body: req.body,
            params: req.params,
            path: req.path,
          }
        };
        EventCreator.error(Event.labels.SITE_USER, errBody);
        res.error(err);
      });
  },

  removeUser: (req, res) => {
    const siteId = Number(req.params.site_id);
    const userId = Number(req.params.user_id);
    let site;

    if (_.isNaN(siteId) || _.isNaN(userId)) {
      return res.error(400);
    }

    return Site.withUsers(siteId).then((model) => {
      if (!model) {
        throw 404;
      }

      site = model;

      if (site.Users.length === 1) {
        throw {
          status: 400,
          message: siteErrors.USER_REQUIRED,
        };
      }
      return authorizer.removeUser(req.user, site);
    })
      .then(() => SiteMembershipCreator
        .revokeSiteMembership({ user: req.user, site, userId }))
      .then(() => UserActionCreator.addRemoveAction({
        userId: req.user.id,
        targetId: userId,
        targetType: 'user',
        siteId: site.id,
      }))
      .then(() => sendJSON(site, res))
      .catch((err) => {
        const errBody = {
          message: 'Error encountered when removing user from site',
          error: err.stack,
          request: {
            params: req.params,
            path: req.path,
          }
        };
        EventCreator.error(Event.labels.SITE_USER, errBody);
        res.error(err);
      });
  },

  create: (req, res) => {
    const { body, user } = req;
    let site;
    const siteParams = { ...body, sharedBucket: false };

    authorizer.create(user, siteParams)
      .then(() => SiteCreator.createSite({
        user,
        siteParams,
      }))
      .then((_site) => {
        site = _site;
        if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
          return ProxyDataSync.saveSite(site)
            .catch((err) => {
              const errBody = {
                message: `Error saving new site@id=${site.id} to proxy database`,
                error: err.stack,
                site,
              };
              EventCreator.error(Event.labels.PROXY_EDGE, errBody);
            });
        }

        return null;
      })
      .then(() => siteSerializer.serialize(site))
      .then((siteJSON) => {
        res.json(siteJSON);
      })
      .catch((err) => {
        const errBody = {
          message: 'Error encountered when adding a new site',
          error: err.stack,
          request: {
            body: req.body,
            path: req.path,
          }
        };
        EventCreator.error(Event.labels.SITE_ADD, errBody);
        res.error(err);
      });
  },

  update: (req, res) => {
    let site;
    const siteId = Number(req.params.id);

    Promise.resolve(siteId).then((id) => {
      if (_.isNaN(id)) {
        throw 404;
      }
      return Site.findByPk(id);
    })
      .then((model) => {
        site = model;
        if (!site) {
          throw 404;
        }
        return authorizer.update(req.user, site);
      })
      .then(() => {
        const params = Object.assign(site, req.body);
        return site.update({
          demoBranch: params.demoBranch,
          demoDomain: params.demoDomain,
          defaultConfig: params.defaultConfig,
          previewConfig: params.previewConfig,
          demoConfig: params.demoConfig,
          defaultBranch: params.defaultBranch,
          domain: params.domain,
          engine: params.engine,
        });
      })
      .then(model => Build.create({
        user: req.user.id,
        site: siteId,
        branch: model.defaultBranch,
        username: req.user.username,
      }))
      .then(build => build.enqueue())
      .then(() => {
        if (site.demoBranch) {
          return Build.create({
            user: req.user.id,
            site: siteId,
            branch: site.demoBranch,
            username: req.user.username,
          })
            .then(build => build.enqueue());
        }
        return null;
      })
      .then(() => siteSerializer.serialize(site))
      .then((siteJSON) => {
        res.json(siteJSON);
      })
      .catch((err) => {
        const errBody = {
          message: 'Error encountered when updating an existing site',
          error: err.stack,
          request: {
            params: req.params,
            body: req.body,
            path: req.path,
          }
        };
        EventCreator.error(Event.labels.SITE_UPDATE, errBody);
        res.error(err);
      });
  },

  addBasicAuth: wrapHandler(async (req, res) => {
    try {
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
          .catch(err => EventCreator.error(Event.labels.SITE_UPDATE, [`site@id=${site.id}`, err.stack]));
      }

      const siteJSON = await siteSerializer.serialize(site);
      return res.json(siteJSON);
    } catch (err) {
      const errBody = {
        message: 'Error encountered when adding basic auth to a site',
        error: err.stack,
        request: {
          params: req.params,
          path: req.path,
        }
      };
      EventCreator.error(Event.labels.SITE_UPDATE, errBody);
      res.error(err);
    }
  }),

  removeBasicAuth: wrapHandler(async (req, res) => {
    try {
      const { params, user } = req;
      const { site_id: siteId } = params;

      const site = await Site.forUser(user).findByPk(siteId);

      if (!site) {
        return res.notFound();
      }

      await site.update({ basicAuth: {} });

      if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
        ProxyDataSync.saveSite(site) // sync to proxy database
          .catch(err => EventCreator.error(Event.labels.SITE_UPDATE, [`site@id=${site.id}`, err.stack]));
      }

      const siteJSON = await siteSerializer.serialize(site);
      return res.json(siteJSON);
    } catch (err) {
      const errBody = {
        message: 'Error encountered when removing basic auth from a site',
        error: err.stack,
        request: {
          params: req.params,
          path: req.path,
        }
      };
      EventCreator.error(Event.labels.SITE_UPDATE, errBody);
      res.error(err);
    }
  }),
};
