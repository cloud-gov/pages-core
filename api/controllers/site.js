const _ = require('underscore');
const authorizer = require('../authorizers/site');
const S3SiteRemover = require('../services/S3SiteRemover');
const SiteCreator = require('../services/SiteCreator');
const SiteMembershipCreator = require('../services/SiteMembershipCreator');
const UserActionCreator = require('../services/UserActionCreator');
const siteSerializer = require('../serializers/site');
const { User, Site, Build } = require('../models');
const siteErrors = require('../responses/siteErrors');
const { logger } = require('../../winston');
const ProxyDataSync = require('../services/ProxyDataSync');
const {
  ValidationError,
  validBasicAuthUsername,
  validBasicAuthPassword,
} = require('../utils/validators');
const { wrapHandler } = require('../utils');
const Features = require('../features');

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

  destroy: (req, res) => {
    let site;
    let siteJSON;

    Promise.resolve(Number(req.params.id))
      .then((id) => {
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
        return siteSerializer.serialize(site);
      })
      .then((json) => {
        siteJSON = json;
        return authorizer.destroy(req.user, site);
      })
      .then(() => S3SiteRemover.removeSite(site))
      .then(() => S3SiteRemover.removeInfrastructure(site))
      .then(() => {
        if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
          ProxyDataSync.removeSite(site)
            .catch(err => logger.error([`site@id=${site.id}`, err, err.stack].join('\n')));
        }
      })
      .then(() => site.destroy())
      .then(() => {
        res.json(siteJSON);
      })
      .catch((err) => {
        logger.error([err.message, err.stack].join('\n\n'));
        res.error(err);
      });
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
      .catch(res.error);
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
            .catch(err => logger.error([`site@id=${site.id}`, err, err.stack].join('\n')));
        }
      })
      .then(() => siteSerializer.serialize(site))
      .then((siteJSON) => {
        res.json(siteJSON);
      })
      .catch((err) => {
        logger.error([JSON.stringify(err), err.stack].join('\n\n'));
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
      }))
      .then(build => build.enqueue())
      .then(() => {
        if (site.demoBranch) {
          return Build.create({
            user: req.user.id,
            site: siteId,
            branch: site.demoBranch,
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
        res.error(err);
      });
  },

  addBasicAuth: wrapHandler(async (req, res) => {
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
        .catch(err => logger.error([`site@id=${site.id}`, err, err.stack].join('\n')));
    }

    const siteJSON = await siteSerializer.serialize(site);
    return res.json(siteJSON);
  }),

  removeBasicAuth: wrapHandler(async (req, res) => {
    const { params, user } = req;
    const { site_id: siteId } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    await site.update({ basicAuth: {} });

    if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
      ProxyDataSync.saveSite(site) // sync to proxy database
        .catch(err => logger.error([`site@id=${site.id}`, err, err.stack].join('\n')));
    }

    const siteJSON = await siteSerializer.serialize(site);
    return res.json(siteJSON);
  }),
};
