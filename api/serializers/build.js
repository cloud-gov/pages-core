const { Build, User, Site } = require("../models")

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const buildIds = serializable.map(build => build.id)
    const query = Build.findAll({ where: { id: buildIds }, include: [ User, Site ] })

    return query.then(builds => {
      return builds.map(build => serializeObject(build))
    })
  } else {
    const build = serializable
    const query = Build.findById(build.id, { include: [ User, Site ] })

    return query.then(build => {
      return serializeObject(build)
    })
  }
}

const serializeObject = (build) => {
  const json = build.toJSON()
  json.user = build.User.toJSON()
  json.site = build.Site.toJSON()
  delete json.User
  delete json.Site
  return json
}

module.exports = { serialize }
