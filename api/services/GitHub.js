const Github = require("github")
const { User } = require("../models")

const createRepoForOrg = (github, options) => {
  return new Promise((resolve, reject) => {
    github.repos.createFromOrg(options, (err, res) => {
      if (err) {
        err.status = err.code
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

const createRepoForUser = (github, options) => {
  return new Promise((resolve, reject) => {
    github.repos.create(options, (err, res) => {
      if (err) {
        err.status = err.code
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

const createWebhook = (github, options) => {
  return new Promise((resolve, reject) => {
    github.repos.createHook(options, (err, res) => {
      if (err) {
        err.status = err.code
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

const getOrganizations = (github) => {
  return new Promise((resolve, reject) => {
    github.user.getOrgs({}, (err, organizations) => {
      if (err) {
        err.status = err.code
        reject(err)
      } else {
        resolve(organizations)
      }
    })
  })
}

const getRepository = (github, options) => {
  return new Promise((resolve, reject) => {
    github.repos.get(options, (err, repo) => {
      if (err) {
        err.status = err.code
        reject(err)
      } else {
        resolve(repo)
      }
    })
  })
}

const githubClient = (accessToken) => {
  return new Promise((resolve, reject) => {
    let client = new Github({ version: "3.0.0" })
    client.authenticate({
      type: 'oauth',
      token: accessToken
    })
    resolve(client)
  })
}

const handleCreateRepoError = (error) => {
  const REPO_EXISTS_MESSAGE = "name already exists on this account"

  const githubError = parseGithubErrorMessage(error)

  if (githubError === REPO_EXISTS_MESSAGE) {
    error.status = 400
    error.message = "A repo with that name already exists."
  } else if (githubError && error.code === 403) {
    error.status = 400
    error.message = githubError
  }

  throw error
}

const handleWebhookError = (error) => {
  const HOOK_EXISTS_MESSAGE = "Hook already exists on this repository"
  const NO_ACCESS_MESSAGE = "Not Found"
  const NO_ADMIN_ACCESS_ERROR_MESSAGE = "You do not have admin access to this repository"

  const githubError = parseGithubErrorMessage(error)

  if (githubError === HOOK_EXISTS_MESSAGE) {
    // noop
    return
  } else if (githubError === NO_ACCESS_MESSAGE) {
    const error = new Error(NO_ADMIN_ACCESS_ERROR_MESSAGE)
    error.status = 400
    throw error
  } else {
    throw error
  }
}

const parseGithubErrorMessage = (error) => {
  try {
    githubError = JSON.parse(error.message).errors[0].message
  } catch(e) {
    try {
      githubError = JSON.parse(error.message).message
    } catch(e) {}
  }

  return githubError
}

module.exports = {
  checkPermissions: (user, owner, repository) => {
    return githubClient(user.githubAccessToken).then(github => {
      return getRepository(github, {
        user: owner,
        repo: repository,
      })
    }).then(repository => {
      return repository.permissions
    })
  },

  createRepo: (user, owner, repository) => {
    return githubClient(user.githubAccessToken).then(github => {
      if (user.username === owner) {
        return createRepoForUser(github, {
          name: repository,
        })
      } else {
        return createRepoForOrg(github, {
          name: repository,
          org: owner,
        })
      }
    }).catch(err => {
      handleCreateRepoError(err)
    })
  },

  getRepository: (user, owner, repository) => {
    return githubClient(user.githubAccessToken).then(github => {
      return getRepository(github, {
        user: owner,
        repo: repository,
      })
    }).catch(err => {
      if (err.status === 404) {
        return null
      } else {
        throw err
      }
    })
  },

  setWebhook: (site, user) => {
    const userId = user.id || user

    return User.findById(userId).then(model => {
      user = model
      return githubClient(user.githubAccessToken)
    }).then(github => {
      return createWebhook(github, {
        user: site.owner,
        repo: site.repository,
        name: 'web',
        active: true,
        config: {
          url: config.webhook.endpoint,
          secret: config.webhook.secret,
          content_type: 'json'
        }
      })
    }).catch(err => {
      handleWebhookError(err)
    })
  },

  validateUser: (accessToken) => {
    var approvedOrgs = config.passport.github.organizations || []

    return githubClient(accessToken).then(github => {
      return getOrganizations(github)
    }).then(organizations => {
      const approvedOrg = organizations.find(organization => {
        return approvedOrgs.indexOf(organization.id) >= 0
      })

      if (!approvedOrg) {
        throw new Error("Unauthorized")
      }
    })
  },
}
