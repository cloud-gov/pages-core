const buildAuthorizer = require("../authorizers/build")

module.exports = {
  create: (req, res) => {
    Promise.resolve(Number(req.param("build_id"))).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Build.findOne(id)
    }).then(build => {
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

    Promise.resolve(Number(req.param("build_id"))).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Build.findOne(id)
    }).then(model => {
      build = model
      if (!build) {
        throw 404
      }
      return buildAuthorizer.findOne(req.user, build)
    }).then(() => {
      return BuildLog.find({ build: build.id }).populate("build")
    }).then(buildLogs => {
      res.json(buildLogs)
    }).catch(err => {
      res.error(err)
    })
  },
}
