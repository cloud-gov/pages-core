const AWS = require("aws-sdk")
const config = require("../../config")

const s3Config = config.s3
const s3Client = new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region,
})

const listPublishedPreviews = (site) => {
  const previewPath = `preview/${site.owner}/${site.repository}/`
  return listFolders(previewPath)
}

const listFolders = (path) => {
  return new Promise((resolve, reject) => {
    s3Client.listObjects({
      Bucket: s3Config.bucket,
      Prefix: path,
      Delimiter: "/"
    }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          prefixes = data.CommonPrefixes.map(prefix => {
            return prefix.Prefix.split("/").slice(-2)[0]
          })
          resolve(prefixes)
        }
      }
    )
  })
}

module.exports = { listPublishedPreviews }
