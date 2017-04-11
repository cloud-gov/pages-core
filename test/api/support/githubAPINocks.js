const nock = require("nock")
const config = require("../../../config")

const accessToken = ({ authorizationCode, accessToken, scope } = {}) => {
  authorizationCode = authorizationCode || "auth-code-123abc"
  accessToken = accessToken || "access-token-123abc"

  if (scope && typeof scope !== "string") {
    scope = scope.join(",")
  } else {
    scope = "user,repo"
  }

  return nock("https://github.com")
    .post("/login/oauth/access_token", (body) => {
      const expectedBody = {
        client_id: config.passport.github.options.clientID,
        client_secret: config.passport.github.options.clientSecret,
        code: authorizationCode,
      }
      return body.client_id === expectedBody.client_id &&
        body.client_secret === expectedBody.client_secret &&
        body.code === expectedBody.code
    })
    .reply(200, {
      token_type: "bearer",
      scope: scope,
      access_token: accessToken
    })
}

const createRepoForOrg = ({ accessToken, org, repo, response } = {}) => {
  let createRepoNock = nock("https://api.github.com")

  if (org && repo) {
    createRepoNock = createRepoNock.post(`/orgs/${org}/repos`, {
      name: repo,
    })
  } else {
    createRepoNock = createRepoNock.post(/\/orgs\/.*\/repos/)
  }

  if (accessToken) {
    createRepoNock = createRepoNock.query({ access_token: accessToken })
  } else {
    createRepoNock = createRepoNock.query(true)
  }

  const typicalResponse = {
    owner: { login: org },
    name: repo,
  }

  response = response || 201
  if (typeof response === "number") {
    response = [response, typicalResponse]
  } else if (response[1] === undefined) {
    response[1] = typicalResponse
  }

  return createRepoNock.reply(...response)
}

const createRepoForUser = ({ accessToken, repo, response } = {}) => {
  let createRepoNock = nock("https://api.github.com")

  if (repo) {
    createRepoNock = createRepoNock.post("/user/repos", {
      name: repo,
    })
  } else {
    createRepoNock = createRepoNock.post("/user/repos")
  }

  if (accessToken) {
    createRepoNock = createRepoNock.query({ access_token: accessToken })
  } else {
    createRepoNock = createRepoNock.query(true)
  }

  const typicalResponse = {
    owner: { login: "your-name-here" },
    name: repo,
  }

  response = response || 201
  if (typeof response === "number") {
    response = [response, typicalResponse]
  } else if (response[1] === undefined) {
    response[1] = typicalResponse
  }

  return createRepoNock.reply(...response)
}

const githubAuth = (username, organizations) => {
  accessToken()
  user({ username })
  userOrganizations({ organizations })
}

const repo = ({ accessToken, owner, repo, response } = {}) => {
  let webhookNock = nock("https://api.github.com")

  if (owner && repo) {
    webhookNock = webhookNock.get(`/repos/${owner}/${repo}`)
  } else {
    webhookNock = webhookNock.get(/\/repos\/.*\/.*/)
  }

  if (accessToken) {
    webhookNock = webhookNock.query({ access_token: accessToken })
  } else {
    webhookNock = webhookNock.query(true)
  }

  const typicalResponse = {
    permissions: {
      admin: true,
      push: true,
      pull: true,
    }
  }

  response = response || 201
  if (typeof response === "number") {
    response = [response, typicalResponse]
  } else if (response[1] === undefined) {
    response[1] = typicalResponse
  }

  return webhookNock.reply(...response)
}

const user = ({ accessToken, githubUserID, username, email } = {}) => {
  accessToken = accessToken || "access-token-123abc"

  userID = githubUserID || Math.floor(Math.random() * 10000)
  username = username || `user-${userID}`
  email = email || `${username}@example.com`

  return nock("https://api.github.com")
    .get(`/user?access_token=${accessToken}`)
    .reply(200, {
      email: email,
      login: username,
      id: githubUserID
    })
}

const userOrganizations = ({ accessToken, organizations, response } = {}) => {
  accessToken = accessToken || "access-token-123abc"
  organizations = organizations || [{ id: 123456 }]

  return nock("https://api.github.com")
    .get(`/user/orgs?access_token=${accessToken}`)
    .reply(response || 200, organizations)
}

const webhook = ({ accessToken, owner, repo, response } = {}) => {
  let webhookNock = nock("https://api.github.com")

  if (owner && repo) {
    webhookNock = webhookNock.post(`/repos/${owner}/${repo}/hooks`, {
      name: 'web',
      active: true,
      config: {
        url: config.webhook.endpoint,
        secret: config.webhook.secret,
        content_type: 'json',
      },
    })
  } else {
    webhookNock = webhookNock.post(/\/repos\/.*\/.*\/hooks/)
  }

  if (accessToken) {
    webhookNock = webhookNock.query({ access_token: accessToken })
  } else {
    webhookNock = webhookNock.query(true)
  }

  response = response || 201
  if (typeof response === "number") {
    response = [response]
  }

  return webhookNock.reply(...response)
}

module.exports = {
  accessToken,
  createRepoForOrg,
  createRepoForUser,
  githubAuth,
  repo,
  user,
  userOrganizations,
  webhook,
}
