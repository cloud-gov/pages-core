const Promise = require("bluebird")
const githubAPINocks = require("./githubAPINocks")

const { Build, BuildLog, Site, User } = require("../../../api/modelss")

const factory = (model, overrides) => {
  const attributes = defaultAttributes[model.name].call(undefined, overrides)

  return Promise.props(attributes).then(attributes => {
    prepareForCreation(model, attributes)
    return model.create(attributes)
  })
}

const prepareForCreation = (model, attributes) => {
  switch (model.name) {
    case "Site":
      githubAPINocks.webhook({
        owner: attributes.owner,
        repo: attributes.repository,
      })
      break
  }
}

const buildAttributes = (overrides = {}) => {
  let { user, site } = overrides

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

const buildLogAttributes = ({ build, source, output } = {}) => ({
  build: build || factory(Build),
  source: source || "clone.sh",
  output: output || "This is output from the build container",
})

const siteAttributes = (overrides = {}) => {
  let { users } = overrides

  if (users === undefined) {
    users = Promise.all([factory(User)])
  }

  const repository = generateUniqueRepository()

  return Object.assign({
    owner: repository.owner,
    repository: repository.name,
    engine: "jekyll",
    users: users
  }, overrides)
}

let repositoryNameStep = 1
generateUniqueRepository = () => {
  return {
    owner: `repo-owner-${repositoryNameStep}`,
    name: `repo-name-${repositoryNameStep++}`
  }
}

const userAttributes = (overrides) => {
  const username = generateUniqueUserName()

  return Object.assign({
    email: `${username}@example.com`,
    username: username,
    githubAccessToken: "fake-access-token",
    githubUserId: 12345
  }, overrides)
}

let userNameStep = 1
const generateUniqueUserName = () => {
  return `user${userNameStep++}`
}

const defaultAttributes = {
  Build: buildAttributes,
  BuildLog: buildLogAttributes,
  Site: siteAttributes,
  User: userAttributes
}

module.exports = factory
