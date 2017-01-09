var decodeb64 = (str) => {
  return new Buffer(str, 'base64').toString('utf8');
}

const verifyUserIsAuthorizedToRestartBuild = (user, build) => {
  return User.findOne(user.id).populate("sites").then(user => {
    const index = user.sites.findIndex(site => site.id === build.site)

    if (index < 0) {
      throw 403
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
      return Build.findOne(build.id).populate("user").populate("site")
    }).then(build => {
      res.json(build)
    }).catch(err => {
      res.error(err)
    })
  },

  status: (req, res) => {
    var message = decodeb64(req.body.message)

    Build.findOne(req.param("id")).then(build => {
      if (!build) {
        throw 404
      } else {
        return Build.completeJob(message, build)
      }
    }).then(build => {
      res.ok()
    }).catch(err => {
      res.error(err)
    })
  },
}
