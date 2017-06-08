const AWS = require('aws-sdk');
const config = require('../../config');

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
const deleteObjects = (objects) => {
  if (objects.length === 0) {
    return Promise.resolve();
  }

  const objectsToDeleteNow = objects.slice(0, 1000);
  const objectsToDeleteLater = objects.slice(1000, objects.length);

  return new Promise((resolve, reject) => {
    s3Client.deleteObjects({
      Bucket: s3Config.bucket,
      Delete: {
        Objects: objectsToDeleteNow.map(object => ({ Key: object })),
      },
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }).then(() =>
    deleteObjects(objectsToDeleteLater)
  );
};

const getObjectsWithPrefix = prefix =>
  new Promise((resolve, reject) => {
    s3Client.listObjects({
      Bucket: s3Config.bucket,
      Prefix: prefix,
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const keys = data.Contents.map(object => object.Key);
        resolve(keys);
      }
    });
  });

const removeSite = site =>
  Promise.all([
    getObjectsWithPrefix(`site/${site.owner}/${site.repository}`),
    getObjectsWithPrefix(`demo/${site.owner}/${site.repository}`),
    getObjectsWithPrefix(`preview/${site.owner}/${site.repository}`),
  ]).then((objects) => {
    const mergedObjects = [].concat(...objects);
    return deleteObjects(mergedObjects);
  });

module.exports = { removeSite };
