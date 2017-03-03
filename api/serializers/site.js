const { Build, User, Site } = require("../models")

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const siteIds = serializable.map(site => site.id)
    const query = Site.findAll({ where: { id: siteIds }, include: [ User, Build ] })

    return query.then(sites => {
      return sites.map(site => serializeObject(site))
    })
  } else {
    const site = serializable
    const query = Site.findById(site.id, { include: [ User, Build ] })

    return query.then(site => {
      return serializeObject(site)
    })
  }
}

const serializeObject = (site) => {
  const json = site.toJSON()
  json.users = site.Users.map(user => user.toJSON())
  json.builds = site.Builds.map(build => build.toJSON())
  delete json.Users
  delete json.Builds
  return json
}

module.exports = { serialize }
