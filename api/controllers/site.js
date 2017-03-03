const authorizer = require("../authorizers/site")
const SiteCreator = require("../services/SiteCreator")
const siteSerializer = require("../serializers/site")
const { User, Site, Build } = require("../models")

module.exports = {
  find: (req, res) => {
    User.findById(req.user.id, { include: [ Site ] }).then(user => {
      return siteSerializer.serialize(user.Sites)
    }).then(sitesJSON => {
      res.json(sitesJSON)
    }).catch(err => {
      res.error(err)
    })
  },

  findOne: (req, res) => {
    let site

    Promise.resolve(Number(req.param("id"))).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Site.findById(id)
    }).then(model => {
      if (model) {
        site = model
      } else {
        throw 404
      }
      return authorizer.findOne(req.user, site)
    }).then(() => {
      return siteSerializer.serialize(site)
    }).then(siteJSON => {
      res.json(siteJSON)
    }).catch(err => {
      res.error(err)
    })
  },

  destroy: (req, res) => {
    let site
    let siteJSON

    Promise.resolve(Number(req.param("id"))).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Site.findById(id)
    }).then(model => {
      if (model) {
        site = model
      } else {
        throw 404
      }
      return siteSerializer.serialize(site)
    }).then(json => {
      siteJSON = json
      return authorizer.destroy(req.user, site)
    }).then(() => {
      return site.destroy()
    }).then(() => {
      res.json(siteJSON)
    }).catch(err => {
      res.error(err)
    })
  },

  create: (req, res) => {
    authorizer.create(req.user, req.body).then(() => {
      return SiteCreator.createSite({
        user: req.user,
        siteParams: req.body,
      })
    }).then(site => {
      return siteSerializer.serialize(site)
    }).then(siteJSON => {
      res.send(siteJSON)
    }).catch(err => {
      console.error(err)
      res.error(err)
    })
  },

  update: (req, res) => {
    let site
    let siteId = Number(req.param("id"))

    Promise.resolve(siteId).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Site.findById(id)
    }).then(model => {
      site = model
      if (!site) {
        throw 404
      }
      return authorizer.update(req.user, site)
    }).then(() => {
      return site.update({
        config: req.body.config || site.config,
        defaultBranch: req.body.defaultBranch || site.defaultBranch,
        domain: req.body.domain || site.domain,
        engine: req.body.engine || site.engine,
        publicPreview: req.body.publicPreview || site.publicPreview,
      })
    }).then(model => {
      let site = model
      return Build.create({
        user: req.user.id,
        site: siteId,
        branch: site.defaultBranch,
      })
    }).then(build => {
      return siteSerializer.serialize(site)
    }).then(siteJSON => {
      res.send(siteJSON)
    }).catch(err => {
      res.error(err)
    })
  }
}
