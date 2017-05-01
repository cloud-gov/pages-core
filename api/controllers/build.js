const authorizer = require("../authorizers/build")
const buildSerializer = require("../serializers/build")
const siteAuthorizer = require("../authorizers/site")
const { Build, Site } = require("../models")

var decodeb64 = (str) => {
  return new Buffer(str, 'base64').toString('utf8');
}

module.exports = {
  find: (req, res) => {
    let site

    Promise.resolve(Number(req.params["site_id"])).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Site.findById(id)
    }).then(model => {
      if (!model) {
        throw 404
      }

      site = model
      return siteAuthorizer.findOne(req.user, site)
    }).then(() => {
      return Build.findAll({
        where: { site: site.id },
        order: [["createdAt", "DESC"]],
      })
    }).then(builds => {
      return buildSerializer.serialize(builds)
    }).then(buildsJSON => {
      res.json(buildsJSON)
    }).catch(err => {
      res.error(err)
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
