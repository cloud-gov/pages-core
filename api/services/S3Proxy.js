const AWS = require('aws-sdk')

const s3Config = sails.config.s3
const S3 = new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region,
})

const findSite = (req) => {
  const owner = req.param("owner")
  const repository = req.param("repo")

  return Site.findOne({
    owner: owner,
    repository: repository,
  }).populate("users").then(site => {
    if (!site) {
      throw httpError({
        message: `No such site: ${owner}/${repository}.`,
        code: 404,
      })
    }
    return site
  })
}

const httpError = ({ message, code }) => {
  const error = new Error(message)
  error.code = `${code}`
  return error
}

const pipeS3ObjectToResponse = ({ key, res }) => {
  S3.getObject({
    Bucket: s3Config.bucket,
    Key: key
  }).on('httpHeaders', (statusCode, headers) => {
    headers['X-Frame-Options'] = 'SAMEORIGIN';
    res.set(headers)
  }).createReadStream().on("error", error => {
    sails.log.error(error)
    res.send(error.statusCode, error.message)
  }).pipe(res)
}

const resolveKey = (path) => {
  if (path.slice(-1) === "/") {
    return Promise.resolve(path + "index.html")
  }

  return new Promise((resolve, reject) => {
    S3.listObjects({
      Bucket: s3Config.bucket,
      Prefix: path
    }, (err, data) => {
      if (err) {
        reject(err)
        return
      } else if (data.Contents.length === 1 && data.Contents[0].Key === path) {
        resolve(path)
      } else {
        resolve(path + "/index.html")
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
      code: 403,
    })
  }

  const userIndex = site.users.findIndex(candidate => {
    return candidate.id === user.id
  })
  if (userIndex < 0) {
    throw httpError({
      message: "User is not authorized to view this site.",
      code: 403,
    })
  }
}

const proxy = (req, res) => {
  return findSite(req).then(site => {
    return verifyUserAuthorization({ user: req.user, site: site })
  }).then(() => {
    return resolveKey(req.path.slice(1))
  }).then(key => {
    pipeS3ObjectToResponse({ key, res })
  })
}

module.exports = { proxy }
