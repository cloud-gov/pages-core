const buildAuthorizer = require("../authorizers/build")

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
