const AWS = require('aws-sdk')
const logger = require("winston")
const config = require("../../config")
const { Site, User } = require("../models")

const s3Config = config.s3
const S3 = new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region,
})

const findSite = (req) => {
  const owner = req.params["owner"]
  const repository = req.params["repo"]

  return Site.findOne({
    where: {
      owner: owner,
      repository: repository,
    },
    include: [ User ],
  }).then(site => {
    if (!site) {
      throw httpError({
        message: `No such site: ${owner}/${repository}.`,
        status: 404,
      })
    }
    return site
  })
}

const httpError = ({ message, status }) => {
  const error = new Error(message)
  error.status = status
  return error
}

const pathIsPreviewRoot = (path) => {
  return path.split("/").length <= 4
}

const pipeS3ObjectToResponse = ({ key, res }) => {
  S3.getObject({
    Bucket: s3Config.bucket,
    Key: key
  }).on('httpHeaders', (statusCode, headers) => {
    headers['X-Frame-Options'] = 'SAMEORIGIN';
    res.set(headers)
  }).createReadStream().on("error", error => {
    logger.error("Error proxying S3 object:", error)
    res.send(error.statusCode, error.message)
  }).pipe(res)
}

const resolveKey = (path) => {
  if (pathIsPreviewRoot(path)) {
    return Promise.resolve({
      status: 302,
      key: "/" + path + "/",
    })
  }

  if (path.slice(-1) === "/") {
    return Promise.resolve({
      status: 200,
      key: path + "index.html",
    })
  }

  return new Promise((resolve, reject) => {
    S3.listObjects({
      Bucket: s3Config.bucket,
      Prefix: path
    }, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const object = data.Contents.find(candidate => {
        return candidate.Key === path || candidate.Key === path + "/index.html"
      })
      if (object && object.Key === path) {
        resolve({ status: 200, key: path })
      } else if (object && object.Key === path + "/index.html") {
        resolve({ status: 302, key: "/" + path + "/" })
      } else {
        resolve({ status: 404 })
      }
    })
  })
}

const verifyUserAuthorization = ({ user, site }) => {
  if (site.publicPreview) {
    return true
  }

  if (!user) {
    throw httpError({
      message: "Public preview is disabled for this site.",
      status: 403,
    })
  }

  const userIndex = site.Users.findIndex(candidate => {
    return candidate.id === user.id
  })
  if (userIndex < 0) {
    throw httpError({
      message: "User is not authorized to view this site.",
      status: 403,
    })
  }
}

const proxy = (req, res) => {
  return findSite(req).then(site => {
    return verifyUserAuthorization({ user: req.user, site: site })
  }).then(() => {
    return resolveKey(req.path.slice(1))
  }).then(({ status, key }) => {
    if (status === 200) {
      pipeS3ObjectToResponse({ key, res })
    } else if (status === 404) {
      res.notFound()
    } else if (status === 302) {
      res.redirect(302, key)
    } else {
      res.error("Unable to resolve S3 object")
    }
  })
}

module.exports = { proxy }
