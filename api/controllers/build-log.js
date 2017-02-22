const buildAuthorizer = require("../authorizers/build")
const buildLogSerializer = require("../serializers/build-log")

module.exports = {
  create: (req, res) => {
    Promise.resolve(Number(req.param("build_id"))).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Build.findById(id)
    }).then(build => {
      if (!build) {
        throw 404
      }
      return BuildLog.create({
        build: build.id,
        output: req.param("output"),
        source: req.param("source"),
      })
    }).then(buildLog => {
      return buildLogSerializer.serialize(buildLog)
    }).then(buildLogJSON => {
      res.json(buildLogJSON)
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
      return Build.findById(id)
    }).then(model => {
      build = model
      if (!build) {
        throw 404
      }
      return buildAuthorizer.findOne(req.user, build)
    }).then(() => {
      return BuildLog.findAll({ where: { build: build.id }})
    }).then(buildLogs => {
      return buildLogSerializer.serialize(buildLogs)
    }).then(buildLogsJSON => {
      res.json(buildLogsJSON)
    }).catch(err => {
      res.error(err)
    })
  },
}
