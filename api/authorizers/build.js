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

const restart = (user, build) => {
  return authorize(user, build)
}

module.exports = { findOne, restart }
