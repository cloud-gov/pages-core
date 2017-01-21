const authorize = (user, build) => {
  return User.findOne(user.id).populate("sites").then(user => {
    for (site of user.sites) {
      if (build.site.id || build.site === site.id) {
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
