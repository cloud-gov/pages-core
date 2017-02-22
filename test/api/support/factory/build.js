const siteFactory = require("./site")
const userFactory = require("./user")

const build = (overrides) => {
  return Promise.props(_attributes(overrides)).then(attributes => {
    Object.keys(attributes).forEach(key => {
      if (attributes[key].sequelize) {
        attributes[key] = attributes[key].id
      }
    })

    return Build.create(attributes)
  })
}

const _attributes = (overrides = {}) => {
  let { user, site } = overrides

  if (!user) {
    user = userFactory()
  }
  if (!site) {
    site = Promise.resolve(user).then(user => {
      return siteFactory({ users: [user] })
    })
  }

  return Object.assign({
    site: site,
    user: user
  }, overrides)
}

module.exports = build
