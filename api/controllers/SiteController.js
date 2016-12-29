const checkNewSiteRepoPermissions = (req) => {
  const owner = req.param("owner") || req.user.username
  const repository = req.param("repository")

  return GitHub.checkPermissions(req.user, owner, repository).then(permissions => {
    if (!permissions || !permissions.push) {
      throw httpError({
        message: "You do not have write access to this repository",
        code: 400,
      })
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

const httpError = ({ message, code }) => {
  const error = new Error(message)
  error.code = `${code}`
  return error
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

const renderError = (err, res) => {
  if (err.code === "400") {
    res.badRequest(err)
  } else {
    res.serverError(err)
  }
}

const throwAnyExistingSiteErrors = ({ req, existingSite }) => {
  if (existingSite){
    if (req.param("template")) {
      throw httpError({
        message: "A site already exists for that owner / repository",
        code: 400
      })
    }

    const userIndex = existingSite.users.findIndex(user => user.id === req.user.id)
    if (userIndex >= 0) {
      throw httpError({
        message: "You've already added this site to Federalist",
        code: 400
      })
    }
  }
}

module.exports = {
  create: (req, res) => {
    let site

    checkNewSiteRepoPermissions(req).then(() => {
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
    }).catch(err => renderError(err, res))
  },

  update: (req, res) => {
    let siteId = req.param("id")

    Site.update(siteId, req.body).then(sites => {
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
    }).catch(err => renderError(err, res))
  }
}
