var Promise = require("bluebird")

var factory = (model, overrides) => {
  var attributes = defaultAttributes[model.globalId].call(undefined, overrides)

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

var siteAttributes = (overrides) => {
  overrides = overrides || {}
  var users = overrides["users"]

  if (users === undefined) {
    users = Promise.all([factory(User)])
  }

  var repository = generateUniqueRepository()

  return Object.assign({
    owner: repository.owner,
    repository: repository.name,
    engine: "jekyll",
    users: users
  }, overrides)
}

var repositroyNameStep = 1
generateUniqueRepository = () => {
  return {
    owner: `repo-owner-${repositroyNameStep}`,
    name: `repo-name-${repositroyNameStep++}`
  }
}

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
