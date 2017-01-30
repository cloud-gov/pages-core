const authorizer = require("../authorizers/site")

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
  let createdSite

  const siteParams = paramsForNewSite(req)
  return Site.create(siteParams).then(site => {
    createdSite = site

    const buildParams = paramsForNewBuild({ site, req })
    return Build.create(buildParams)
  }).then(() => {
    return Site.findOne(createdSite.id).populate("users").populate("builds")
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

    const userIndex = existingSite.users.findIndex(user => user.id === req.user.id)
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
    User.findOne(req.user.id).populate("sites").then(user => {
      const siteIds = user.sites.map(site => site.id)
      return Site.find({ id: siteIds }).populate("users").populate("builds")
    }).then(sites => {
      res.json(sites)
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
      return Site.findOne(id).populate("users").populate("builds")
    }).then(model => {
      if (model) {
        site = model
      } else {
        throw 404
      }
      return authorizer.findOne(req.user, site)
    }).then(() => {
      res.json(site)
    }).catch(err => {
      res.error(err)
    })
  },

  destroy: (req, res) => {
    let site

    Promise.resolve(Number(req.param("id"))).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Site.findOne(id).populate("users").populate("builds")
    }).then(model => {
      if (model) {
        site = model
      } else {
        throw 404
      }
      return authorizer.destroy(req.user, site)
    }).then(() => {
      return site.destroy()
    }).then(() => {
      res.json(site)
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
        owner: req.param("owner"),
        repository: req.param("repository")
      }).populate("users").populate("builds")
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
      site.users.add(req.user.id)
      return site.save()
    }).then(result => {
      return Site.findOne(site.id).populate("users").populate("builds")
    }).then(site => {
      res.send(site)
    }).catch(err => {
      res.error(err)
    })
  },

  update: (req, res) => {
    let siteId = Number(req.param("id"))

    Promise.resolve(siteId).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Site.findOne(id)
    }).then(site => {
      if (!site) {
        throw 404
      }
      return authorizer.update(req.user, site)
    }).then(() => {
      return Site.update(siteId, req.body)
    }).then(sites => {
      let site = sites[0]
      return Build.create({
        user: req.user.id,
        site: siteId,
        branch: site.defaultBranch,
      })
    }).then(build => {
      return Site.findOne(siteId).populate("users").populate("builds")
    }).then(site => {
      res.send(site)
    }).catch(err => {
      res.error(err)
    })
  }
}
