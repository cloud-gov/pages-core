var Promise = require("bluebird")

var factory = (model, overrides) => {
  var attributes = defaultAttributes[model.globalId].call(overrides)

  return Promise.props(attributes).then(attributes => {
    return model.create(attributes)
  })
}

var buildAttributes = (overrides) => {
  overrides = overrides || {}
  var user = overrides["user"]
  var site = overrides["site"]

  if (!user) {
    user = factory(User)
  }
  if (!site) {
    site = Promise.resolve(user).then(user => {
      return factory(Site, { users: [user] })
    })
  }

  return Object.assign({
    site: site,
    user: user
  }, overrides)
}

var siteAttributes = (overrides) => Object.assign({
  owner: "user",
  repository: "site",
  engine: "jekyll",
  users: []
}, overrides)

var userAttributes = (overrides) => {
  var username = generateUniqueUserName()

  return Object.assign({
    email: `${username}@example.com`,
    username: username
  }, overrides)
}

var userNameStep = 1
var generateUniqueUserName = () => {
  return `user${userNameStep++}`
}

var defaultAttributes = {
  Build: buildAttributes,
  Site: siteAttributes,
  User: userAttributes
}

module.exports = factory
