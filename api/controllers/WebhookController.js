const crypto = require('crypto')
const buildSerializer = require("../serializers/build")

module.exports = {
  github: function(req, res) {
    signWebhookRequest(req).then(() => {
      if (req.body.commits && req.body.commits.length > 0) {
        return createBuildForWebhookRequest(req)
      }
    }).then(build => {
      if (!build) {
        res.ok("No new commits found. No build scheduled.")
      } else {
        return buildSerializer.serialize(build)
      }
    }).then(buildJSON => {
      if (buildJSON) {
        res.json(buildJSON)
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

const signWebhookRequest = (request) => {
  return new Promise((resolve, reject) => {
    const webhookSecret = sails.config.webhook.secret
    const requestBody = JSON.stringify(request.body)

    const signature = request.headers["x-hub-signature"]
    const signedRequestBody = signBlob(webhookSecret, requestBody)

    if (!signature) {
      reject(new Error("No X-Hub-Signature found on request"))
    } else if (signature !== signedRequestBody) {
      reject(new Error("X-Hub-Signature does not match blob signature"))
    } else {
      resolve(true)
    }
  })
}

const signBlob = (key, blob) => {
  return 'sha1=' + crypto.createHmac('sha1', key).update(blob).digest('hex')
}

const createBuildForWebhookRequest = (request) => {
  let buildParams

  const user = findUserForWebhookRequest(request)
  const site = findSiteForWebhookRequest(request)

  return Promise.props({ user, site }).then((models) => {
    buildParams = models
    return addUserToSite(buildParams)
  }).then(() => {
    return Build.create({
      branch: request.body.ref.replace('refs/heads/', ''),
      site: buildParams.site.id,
      user: buildParams.user.id,
    })
  })
}

const findUserForWebhookRequest = (request) => {
  const username = request.body.sender.login

  return User.findOrCreate({
    where: { username },
    defaults: { username },
  }).then(users => {
    if (!users.length) {
      throw new Error(`Unable to find or create Federalist user with username ${username}`)
    } else {
      return users[0]
    }
  })
}

const findSiteForWebhookRequest = (request) => {
  const owner = request.body.repository.full_name.split('/')[0]
  const repository = request.body.repository.full_name.split('/')[1]

  return Site.findOne({ where: { owner, repository } }).then(site => {
    if (!site) {
      throw new Error(`Unable to find Federalist site with ${owner}/${repository}`)
    } else {
      return site
    }
  })
}

const addUserToSite = ({ user, site }) => {
  return user.addSite(site)
}
