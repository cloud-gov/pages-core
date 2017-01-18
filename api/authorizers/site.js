const authorize = (user, site) => {
  return User.findOne(user.id).populate("sites").then(user => {
    for (candidateSite of user.sites) {
      if (site.id === candidateSite.id) {
        return Promise.resolve()
      }
    }
    return Promise.reject(403)
  })
}

const create = (user, params) => {
  return Promise.resolve()
}

const findOne = (user, site) => {
  return authorize(user, site)
}

const update = (user, site) => {
  return authorize(user, site)
}

const destroy = (user, site) => {
  return authorize(user, site)
}

module.exports = { create, findOne, update, destroy }
