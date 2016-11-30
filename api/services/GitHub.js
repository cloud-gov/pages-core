const Github = require("github")

const getOrganizations = (github) => {
  return new Promise((resolve, reject) => {
    github.user.getOrgs({}, function(err, organizations) {
      if (err) {
        reject(err)
      } else {
        resolve(organizations)
      }
    })
  })
}

const getRepository = (github, options) => {
  return new Promise((resolve, reject) => {
    github.repos.get(options, function(err, repo) {
      if (err) {
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

module.exports = {
  setWebhook: function(site, user, done) {
    return User.findOne(user).then(model => {
      user = model
      return githubClient(user.githubAccessToken)
    }).then(github => {
      github.repos.createHook({
        user: site.owner,
        repo: site.repository,
        name: 'web',
        active: true,
        config: {
          url: sails.config.webhook.endpoint,
          secret: sails.config.webhook.secret,
          content_type: 'json'
        }
      }, done)
    }).catch(done)
  },

  validateUser: function(accessToken) {
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

  checkPermissions: function(user, owner, repository, done) {
    return githubClient(user.githubAccessToken).then(github => {
      return getRepository(github, {
        user: owner,
        repo: repository,
      })
    }).then(repository => {
      if (!repository) {
        done("This repository does not exit")
      } else {
        done(null, repository.permissions)
      }
    }).catch(err => {
      done(err)
    })
  },
}
