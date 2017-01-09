const authorizeUserForBuild = ({ user, build }) => {
  return User.findOne(user.id).populate("sites").then(user => {
    const siteIndex = user.sites.findIndex(site => {
      return site.id === build.site
    })
    if (siteIndex < 0) {
      throw 403
    }
  })
}

module.exports = {
  create: (req, res) => {
    Build.findOne(req.param("build_id")).then(build => {
      if (!build) {
        throw 404
      }
      return BuildLog.create({
        build: build,
        output: req.param("output"),
        source: req.param("source"),
      })
    }).then(buildLog => {
      return BuildLog.findOne(buildLog.id).populate("build")
    }).then(buildLog => {
      res.json(buildLog)
    }).catch(err => {
      res.error(err)
    })
  },

  find: (req, res) => {
    let build

    Build.findOne(req.param("build_id")).then(model => {
      build = model

      if (!build) {
        throw 404
      }

      return authorizeUserForBuild({
        build: build,
        user: req.user,
      })
    }).then(() => {
      return BuildLog.find({ build: build.id }).populate("build")
    }).then(buildLogs => {
      res.json(buildLogs)
    }).catch(err => {
      res.error(err)
    })
  },

  _config: {
    actions: false,
    shortcuts: false,
    rest: false,
  },
}
