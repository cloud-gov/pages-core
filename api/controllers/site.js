const authorizer = require('../authorizers/site');
const S3SiteRemover = require('../services/S3SiteRemover');
const SiteCreator = require('../services/SiteCreator');
const SiteMembershipCreator = require('../services/SiteMembershipCreator');
const siteSerializer = require('../serializers/site');
const { User, Site, Build } = require('../models');

const sendJSON = (site, res) =>
  siteSerializer.serialize(site)
    .then(siteJSON => res.json(siteJSON));

module.exports = {
  findAllForUser: (req, res) => {
    User.findById(req.user.id, { include: [Site] })
      .then(user => siteSerializer.serialize(user.Sites))
      .then((sitesJSON) => {
        res.json(sitesJSON);
      }).catch((err) => {
        res.error(err);
      });
  },

  findById: (req, res) => {
    let site;

    Promise.resolve(Number(req.params.id)).then((id) => {
      if (isNaN(id)) {
        throw 404;
      }
      return Site.findById(id);
    }).then((model) => {
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
        if (isNaN(id)) {
          throw 404;
        }
        return Site.findById(id);
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
      .then(() => site.destroy())
      .then(() => {
        res.json(siteJSON);
      })
      .catch((err) => {
        res.error(err);
      });
  },

  addUser: (req, res) => {
    const body = req.body;
    if (!body.owner || !body.repository) {
      res.error(400);
      return;
    }

    authorizer.addUser(req.user, body)
      .then(() => SiteMembershipCreator.createSiteMembership({
        user: req.user,
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
    const { site_id: siteId, user_id: userId } = req.params;

    if (!Number(siteId) || !Number(userId)) {
      return res.error(400);
    }

    return Site.withUsers(siteId).then((site) => {
      if (!site) {
        throw 404;
      }

      if (site.Users.length === 1) {
        throw {
          status: 400,
          message: 'A site must have at least one user. If you want to remove the last user, delete the site from Settings -> Advanced',
        };
      }

      return authorizer.removeUser(req.user, site).then(() => site);
    }).then(site =>
      SiteMembershipCreator.revokeSiteMembership({
        user: req.user,
        site,
        userId,
      })
    ).then(() => Site.withUsers(siteId))
    .then(site => sendJSON(site, res))
    .catch(res.error);
  },

  create: (req, res) => {
    const body = req.body;
    authorizer.create(req.user, body)
      .then(() => SiteCreator.createSite({
        user: req.user,
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

  update: (req, res) => {
    let site;
    const siteId = Number(req.params.id);

    Promise.resolve(siteId).then((id) => {
      if (isNaN(id)) {
        throw 404;
      }
      return Site.findById(id);
    }).then((model) => {
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
        config: params.config,
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
    .then(() => {
      if (site.demoBranch) {
        return Build.create({
          user: req.user.id,
          site: siteId,
          branch: site.demoBranch,
        });
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
};
