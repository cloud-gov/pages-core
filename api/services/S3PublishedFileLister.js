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

const listPublishedFilesForBranch = (site, branch) => {
  let filepath
  if (site.defaultBranch === branch) {
    filepath = `site/${site.owner}/${site.repository}`
  } else {
    filepath = `preview/${site.owner}/${site.repository}/${branch}`
  }
  return listFiles(filepath)
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

const listFiles = (path) => {
  return new Promise((resolve, reject) => {
    s3Client.listObjects({
      Bucket: s3Config.bucket,
      Prefix: path,
    }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        const prefixComponents = path.split("/").length
        files = data.Contents.map(object => {
          const name = object.Key.split("/").slice(prefixComponents).join("/")
          const size = Number(object.Size)
          return { name, size }
        })
        resolve(files)
      }
    })
  })
}

module.exports = { listPublishedPreviews, listPublishedFilesForBranch }
