const { User } = require("../../../../api/models")

const user = (overrides) => {
  return Promise.props(_attributes(overrides)).then(attributes => {
    return User.create(attributes)
  })
}

const _attributes = (overrides) => {
  const username = _generateUniqueUserName()

  return Object.assign({
    email: `${username}@example.com`,
    username: username,
    githubAccessToken: "fake-access-token",
    githubUserId: 12345,
    signedInAt: new Date(),
  }, overrides)
}

let _userNameStep = 1
const _generateUniqueUserName = () => {
  return `user${_userNameStep++}`
}

module.exports = user
