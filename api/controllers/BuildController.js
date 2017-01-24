const authorizer = require("../authorizers/build")

var decodeb64 = (str) => {
  return new Buffer(str, 'base64').toString('utf8');
}

module.exports = {
  find: (req, res) => {
    Build.find({ user: req.user.id }).populate("user").populate("site").then(builds => {
      res.json(builds)
    })
  },

  create: (req, res) => {
    const params = {
      branch: req.param("branch"),
      site: req.param("site"),
      user: req.user.id,
    }
    authorizer.create(req.user, params).then(() => {
      return Build.create(params)
    }).then(build => {
      return Build.findOne(build.id).populate("user").populate("site")
    }).then(build => {
      res.json(build)
    }).catch(err => {
      res.error(err)
    })
  },

  findOne: (req, res) => {
    let build

    Promise.resolve(Number(req.param("id"))).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Build.findOne(id).populate("user").populate("site")
    }).then(model => {
      if (model) {
        build = model
      } else {
        res.notFound()
      }
      return authorizer.findOne(req.user, build)
    }).then(() => {
      res.json(build)
    }).catch(err => {
      res.error(err)
    })
  },

  status: (req, res) => {
    var message = decodeb64(req.body.message)

    Promise.resolve(Number(req.param("id"))).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Build.findOne(id).populate("user").populate("site")
    }).then(build => {
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
