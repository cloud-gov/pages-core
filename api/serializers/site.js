const { Site } = require("../models")

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const siteIds = serializable.map(site => site.id)
    const query = Site.findAll({ where: { id: siteIds } })

    return query.then(sites => {
      return sites.map(site => serializeObject(site))
    })
  } else {
    const site = serializable
    const query = Site.findById(site.id)

    return query.then(site => {
      return serializeObject(site)
    })
  }
}

const serializeObject = (site) => {
  const json = site.toJSON()
  return json
}

module.exports = { serialize }
