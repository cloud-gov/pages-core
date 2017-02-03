const userFactory = require("./user")

const site = (overrides) => {
  let site, users

  return Promise.props(_attributes(overrides)).then(attributes => {
    users = attributes.users.slice()
    delete attributes.users

    return Site.create(attributes)
  }).then(model => {
    site = model
    const userPromises = users.map(user => {
      return site.addUser(user)
    })
    return Promise.all(userPromises)
  }).then(() => {
    return Site.findById(site.id)
  })
}

const _attributes = (overrides = {}) => {
  let { users } = overrides

  if (users === undefined) {
    users = Promise.all([userFactory()])
  }

  const repository = _generateUniqueRepository()

  return Object.assign({
    owner: repository.owner,
    repository: repository.name,
    engine: "jekyll",
    users: users
  }, overrides)
}

let _repositoryNameStep = 1
_generateUniqueRepository = () => {
  return {
    owner: `repo-owner-${_repositoryNameStep}`,
    name: `repo-name-${_repositoryNameStep++}`
  }
}

module.exports = site
