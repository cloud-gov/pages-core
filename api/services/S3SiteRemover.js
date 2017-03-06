const AWS = require("aws-sdk")
const config = require("../../config")

const s3Config = config.s3
const s3Client = () => new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region,
})

const removeSite = site => {
  return Promise.all([
    getObjectsWithPrefix(`site/${site.owner}/${site.repository}`),
    getObjectsWithPrefix(`preview/${site.owner}/${site.repository}`),
  ]).then(objects => {
    objects = objects[0].concat(objects[1])
    return deleteObjects(objects)
  })
}

const deleteObjects = objects => {
  return new Promise((resolve, reject) => {
    s3Client().deleteObjects({
      Bucket: s3Config.bucket,
      Delete: {
        Objects: objects.map(object => ({ Key: object }))
      },
    }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const getObjectsWithPrefix = prefix => {
  return new Promise((resolve, reject) => {
    s3Client().listObjects({
      Bucket: s3Config.bucket,
      Prefix: prefix,
    }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        const keys = data.Contents.map(object => object.Key)
        resolve(keys)
      }
    })
  })
}

module.exports = { removeSite }
