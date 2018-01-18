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
  if (!keys.length) {
    return Promise.resolve();
  }

  const keysToDeleteNow = keys.slice(0, S3Helper.S3_DEFAULT_MAX_KEYS);
  const keysToDeleteLater = keys.slice(S3Helper.S3_DEFAULT_MAX_KEYS, keys.length);

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

const removeSite = (site) => {
  const prefixes = [
    `site/${site.owner}/${site.repository}`,
    `demo/${site.owner}/${site.repository}`,
    `preview/${site.owner}/${site.repository}`,
  ];

  return Promise.all(
    prefixes.map(prefix => getKeys(`${prefix}/`))
  ).then((keys) => {
    // S3 puts redirect objects in the root of each user's folder which correspond to the
    // names of each site prefix. We have to manually add them to the array of keys to delete
    // because `listObjects` will no longer find them now that each prefix is suffixed
    // with a trailing slash
    const redirectObjects = prefixes.slice(0);
    const mergedKeys = redirectObjects.concat(...keys);

    return deleteObjects(mergedKeys);
  });
};

module.exports = { removeSite };
