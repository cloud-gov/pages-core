var crypto = require('crypto')

module.exports = {
  github: function(req, res) {
    signWebhookRequest(req).then(() => {
      if (req.body.commits && req.body.commits.length > 0) {
        return createBuildForWebhookRequest(req)
      }
    }).then(build => {
      if (build) {
        res.ok(build)
      } else {
        res.ok("No new commits found. No build scheduled.")
      }
    }).catch(err => {
      if (err.message) {
        res.badRequest(err.message)
      } else {
        sails.log.error(err)
        res.badRequest()
      }
    })
  }
}

var signWebhookRequest = (request) => {
  return new Promise((resolve, reject) => {
    var webhookSecret = sails.config.webhook.secret
    var requestBody = JSON.stringify(request.body)

    var signature = request.headers["x-hub-signature"]
    var signedRequestBody = signBlob(webhookSecret, requestBody)

    if (!signature) {
      reject(new Error("No X-Hub-Signature found on request"))
    } else if (signature !== signedRequestBody) {
      reject(new Error("X-Hub-Signature does not match blob signature"))
    } else {
      resolve(true)
    }
  })
}

var signBlob = (key, blob) => {
  return 'sha1=' + crypto.createHmac('sha1', key).update(blob).digest('hex')
}

var createBuildForWebhookRequest = (request) => {
  var user = findUserForWebhookRequest(request)
  var site = findSiteForWebhookRequest(request)

  return Promise.props({ user, site }).then(buildParams => {
    buildParams.branch = request.body.ref.replace('refs/heads/', '')
    return Build.create(buildParams)
  })
}

var findUserForWebhookRequest = (request) => {
  var username = request.body.sender.login

  return User.findOrCreate({ username }).then(user => {
    if (!user) {
      throw new Error(`Unable to find or create Federalist user with username ${username}`)
    } else {
      return user
    }
  })
}

var findSiteForWebhookRequest = (request) => {
  var owner = request.body.repository.full_name.split('/')[0]
  var repository = request.body.repository.full_name.split('/')[1]

  return Site.findOne({ owner, repository }).then(site => {
    if (!repository) {
      throw new Error(`Unable to find Federalist site with ${owner}/${repository}`)
    } else {
      return site
    }
  })
}
