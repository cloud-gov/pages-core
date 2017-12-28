const AWS = require('aws-sdk');
const config = require('../../config');
const S3Helper = require('./S3Helper');

const s3Config = config.s3;
const s3Client = new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region,
});

/**
  Deletes the array of S3 objects passed to it.
  Since AWS limits the number of objects that can be deleted at a time, this
  method deletes the objects 1000 at a time. It does so recursively so each
  group of 1000 is deleted one after the other instead of simultaneously. This
  prevents the delete requests from breaking AWS's rate limit.
*/
const deleteObjects = (keys) => {
  if (keys.length === 0) {
    return Promise.resolve();
  }

  const keysToDeleteNow = keys.slice(0, 1000);
  const keysToDeleteLater = keys.slice(1000, keys.length);

  return new Promise((resolve, reject) => {
    s3Client.deleteObjects({
      Bucket: s3Config.bucket,
      Delete: {
        Objects: keysToDeleteNow.map(object => ({ Key: object })),
      },
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }).then(() =>
    deleteObjects(keysToDeleteLater)
  );
};

const getKeys = prefix =>
  S3Helper.listObjects(prefix)
    .then(objects => objects.map(o => o.Key));

const removeSite = site =>
  Promise.all([
    getKeys(`site/${site.owner}/${site.repository}`),
    getKeys(`demo/${site.owner}/${site.repository}`),
    getKeys(`preview/${site.owner}/${site.repository}`),
  ]).then((keys) => {
    const mergedKeys = [].concat(...keys);
    return deleteObjects(mergedKeys);
  });

module.exports = { removeSite };
