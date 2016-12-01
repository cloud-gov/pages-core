var decodeb64 = (str) => {
  return new Buffer(str, 'base64').toString('utf8');
}

const verifyUserIsAuthorizedToRestartBuild = (user, build) => {
  return User.findOne(user.id).populate("sites").then(user => {
    const index = user.sites.findIndex(site => site.id === build.site)

    if (index < 0) {
      const error = new Error("Unauthorized")
      error.statusCode = 403
      throw error
    }
  })
}

module.exports = {
  restart: (req, res) => {
    let build

    Build.findOne(req.param("id")).then(model => {
      build = model
      return verifyUserIsAuthorizedToRestartBuild(req.user, build)
    }).then(() => {
      return Build.create({
        branch: build.branch,
        site: build.site,
        user: req.user.id,
      })
    }).then(build => {
      res.json(build)
    }).catch(err => {
      if (err.statusCode === 403) {
        res.forbidden()
      } else {
        res.badRequest(err)
      }
    })
  },

  status: (req, res) => {
    var message = decodeb64(req.body.message)

    Build.findOne(req.param("id")).then(build => {
      if (!build) {
        var error = new Error(`Unable to find build with id: ${req.param("id")}`)
        error.statusCode = 404
        throw error
      } else {
        return Build.completeJob(message, build)
      }
    }).then(build => {
      res.ok()
    }).catch(err => {
      if (err.statusCode == 404) {
        res.notFound()
      } else {
        res.serverError()
        sails.log.error(err)
      }
    })
  },
}
