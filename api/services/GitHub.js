const Github = require("github")

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

const handleWebhookError = (error) => {
  const HOOK_EXISTS_MESSAGE = "Hook already exists on this repository"
  const NO_ACCESS_MESSAGE = "Not Found"
  const NO_ADMIN_ACCESS_ERROR_MESSAGE = "You do not have admin access to this repository"
  let githubError

  try {
    githubError = JSON.parse(error.message).errors[0].message
  } catch(e) {
    try {
      githubError = JSON.parse(error.message).message
    } catch(e) {}
  }

  if (githubError === HOOK_EXISTS_MESSAGE) {
    // noop
    return
  } else if (githubError === NO_ACCESS_MESSAGE) {
    throw new Error(NO_ADMIN_ACCESS_ERROR_MESSAGE)
  } else {
    throw error
  }
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

  setWebhook: (site, user) => {
    return User.findById(user).then(model => {
      user = model
      return githubClient(user.githubAccessToken)
    }).then(github => {
      return createWebhook(github, {
        user: site.owner,
        repo: site.repository,
        name: 'web',
        active: true,
        config: {
          url: sails.config.webhook.endpoint,
          secret: sails.config.webhook.secret,
          content_type: 'json'
        }
      })
    }).catch(err => {
      handleWebhookError(err)
    })
  },

  validateUser: (accessToken) => {
    var approvedOrgs = sails.config.passport.github.organizations || []

    return githubClient(accessToken).then(github => {
      return getOrganizations(github)
    }).then(organizations => {
      var usersApprovedOrgs = _(organizations)
        .pluck('id')
        .intersection(approvedOrgs)
        .value()

      if (usersApprovedOrgs.length <= 0) {
        throw new Error("Unauthorized")
      }
    })
  },
}
