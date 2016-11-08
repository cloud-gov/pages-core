var nock = require("nock")

var accessToken = (options) => {
  options = options || {}

  var authorizationCode = options.authorizationCode || "auth-code-123abc"
  var accessToken = options.accessToken || "access-token-123abc"

  var scope
  if (options.scope) {
    scope = options.scope.join(",")
  } else {
    scope = "user,repo"
  }

  return nock("https://github.com")
    .post("/login/oauth/access_token", {
      client_id: sails.config.passport.github.options.clientID,
      client_secret: sails.config.passport.github.options.clientSecret,
      code: authorizationCode
    })
    .reply(200, {
      token_type: "bearer",
      scope: scope,
      access_token: accessToken
    })
}

var user = (options) => {
  options = options || {}

  var accessToken = options.accessToken || "access-token-123abc"

  var userID = options.githubUserID || Math.floor(Math.random() * 10000)
  var username = options.username || `user-${userID}`
  var email = options.email || `${username}@example.com`

  return nock("https://api.github.com")
    .get(`/user?access_token=${accessToken}`)
    .reply(200, {
      email: email,
      login: username,
      id: userID
    })
}

var userOrganizations = (options) => {
  options = options || {}

  var accessToken = options.accessToken || "access-token-123abc"
  var organizations = options.organizations || [{ id: 123456 }]

  return nock("https://api.github.com")
    .get(`/user/orgs?access_token=${accessToken}`)
    .reply(200, organizations)
}

var githubAuth = (username, organizations) => {
  accessToken()
  user({ username: username })
  userOrganizations({ organizations: organizations })
}

module.exports = {
  accessToken: accessToken,
  user: user,
  userOrganizations: userOrganizations,
  githubAuth: githubAuth
}
