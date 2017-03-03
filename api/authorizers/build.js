const { User, Site } = require("../models")

const authorize = (user, build) => {
  return User.findById(user.id, { include: [Site] }).then(user => {
    for (site of user.Sites) {
      if (build.site || build.Site.id === site.id) {
        return Promise.resolve()
      }
    }
    return Promise.reject(403)
  })
}

const findOne = (user, build) => {
  return authorize(user, build)
}

const create = (user, params) => {
  if (user.id != params.user) {
    throw 403
  }
  return authorize(user, params)
}

module.exports = { findOne, create }
