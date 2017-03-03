const { Build, User, Site } = require("../models")

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const userIds = serializable.map(user => user.id)
    const query = User.findAll({ where: { id: userIds }, include: [ Site, Build ] })

    return query.then(users => {
      return users.map(user => serializeObject(user))
    })
  } else {
    const user = serializable
    const query = User.findById(user.id, { include: [ Site, Build ] })

    return query.then(user => {
      return serializeObject(user)
    })
  }
}

const serializeObject = (user) => {
  const json = user.toJSON()
  json.sites = user.Sites.map(site => site.toJSON())
  json.builds = user.Builds.map(build => build.toJSON())
  delete json.Sites
  delete json.Builds
  return json
}

module.exports = { serialize }
