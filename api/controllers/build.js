const authorizer = require("../authorizers/build")
const buildSerializer = require("../serializers/build")
const { Build } = require("../models")

var decodeb64 = (str) => {
  return new Buffer(str, 'base64').toString('utf8');
}

module.exports = {
  find: (req, res) => {
    Build.findAll({ where: { user: req.user.id } }).then(builds => {
      return buildSerializer.serialize(builds)
    }).then(buildsJSON => {
      res.json(buildsJSON)
    })
  },

  create: (req, res) => {
    const params = {
      branch: req.body["branch"],
      site: req.body["site"],
      user: req.user.id,
    }
    authorizer.create(req.user, params).then(() => {
      return Build.create(params)
    }).then(build => {
      return buildSerializer.serialize(build)
    }).then(buildJSON => {
      res.json(buildJSON)
    }).catch(err => {
      res.error(err)
    })
  },

  findOne: (req, res) => {
    let build

    Promise.resolve(Number(req.params["id"])).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Build.findById(id)
    }).then(model => {
      if (model) {
        build = model
      } else {
        res.notFound()
      }
      return authorizer.findOne(req.user, build)
    }).then(() => {
      return buildSerializer.serialize(build)
    }).then(buildJSON => {
      res.json(buildJSON)
    }).catch(err => {
      res.error(err)
    })
  },

  status: (req, res) => {
    var message = decodeb64(req.body.message)

    Promise.resolve(Number(req.params["id"])).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Build.findById(id)
    }).then(build => {
      if (!build) {
        throw 404
      } else {
        return build.completeJob(message)
      }
    }).then(build => {
      res.ok()
    }).catch(err => {
      res.error(err)
    })
  },
}
