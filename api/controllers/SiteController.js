const authorizer = require("../authorizers/site")
const siteSerializer = require("../serializers/site")

const checkNewSiteRepoPermissions = (req) => {
  const owner = req.param("owner") || req.user.username
  const repository = req.param("repository")

  return GitHub.checkPermissions(req.user, owner, repository).then(permissions => {
    if (!permissions || !permissions.push) {
      throw {
        message: "You do not have write access to this repository",
        status: 400,
      }
    }
  })
}

const createAndBuildSite = (req) => {
  const siteParams = paramsForNewSite(req)
  let site = Site.build(siteParams)

  return site.validate().then(error => {
    if (error) {
      throw error
    }
    return GitHub.setWebhook(site, req.user.id)
  }).then(() => {
    return site.save()
  }).then(createdSite => {
    site = createdSite

    const buildParams = paramsForNewBuild({ site, req })
    return Build.create(buildParams)
  }).then(() => {
    return site
  })
}

const paramsForNewBuild = ({ site, req }) => ({
  user: req.user.id,
  site: site.id,
  branch: site.defaultBranch,
  source: paramsForNewBuildSource(req)
})

const paramsForNewBuildSource = (req) => {
  const templateName = req.param("template")
  if (templateName) {
    const template = sails.config.templates[templateName]
    if (!template) {
      throw new Error(`No such template: ${templateName}`)
    }
    return { repository: template.repo, owner: template.owner }
  }
}

const paramsForNewSite = (req) => ({
  owner: req.param('owner') || req.user.username,
  repository: req.param('repository'),
  defaultBranch: req.param('defaultBranch'),
  engine: req.param('engine'),
  users: [req.user.id]
})

const throwAnyExistingSiteErrors = ({ req, existingSite }) => {
  if (existingSite){
    if (req.param("template")) {
      throw {
        message: "A site already exists for that owner / repository",
        status: 400
      }
    }

    const userIndex = existingSite.Users.findIndex(user => user.id === req.user.id)
    if (userIndex >= 0) {
      throw {
        message: "You've already added this site to Federalist",
        status: 400
      }
    }
  }
}

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
    let site

    authorizer.create(req.user, req.body).then(() => {
      return checkNewSiteRepoPermissions(req)
    }).then(() => {
      return Site.findOne({
        where: {
          owner: req.param("owner"),
          repository: req.param("repository"),
        },
        include: [ User, Build ],
      })
    }).then(existingSite => {
      throwAnyExistingSiteErrors({
        existingSite,
        req,
      })

      if (existingSite) {
        return existingSite
      } else {
        return createAndBuildSite(req)
      }
    }).then(model => {
      site = model
      return site.addUser(req.user.id)
    }).then(() => {
      return siteSerializer.serialize(site)
    }).then(siteJSON => {
      res.send(siteJSON)
    }).catch(err => {
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
