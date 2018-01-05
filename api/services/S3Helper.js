const AWS = require('aws-sdk');
const config = require('../../config');

const s3Config = config.s3;

const S3_DEFAULT_MAX_KEYS = 1000;

const s3Client = new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region,
});

function shouldPageResults(totalMaxObjects, isTruncated, objects) {
  // We're ready to exit if the totalMaxObjects is defined, and
  // if either the response data are not truncated
  // or the current objects length is >= to the desired totalMaxObjects
  return totalMaxObjects && (!isTruncated || objects.length >= totalMaxObjects);
}

function createPagedResults(totalMaxObjects, isTruncated, objects) {
  // First, truncate the objects to the maximum total objects
  // or its length (slice will only go as far as the array's length)
  const truncatedObjects = objects.slice(0, totalMaxObjects);

  const pagedResults = {
    isTruncated,
    objects: truncatedObjects,
  };

  return pagedResults;
}

function listObjectsHelper(currObjects, extraS3Params = {}, opts = {}, callback) {
  const listObjectArgs = Object.assign({}, {
    Bucket: s3Config.bucket,
  }, extraS3Params);

  s3Client.listObjectsV2(listObjectArgs, (err, data) => {
    if (err) {
      return callback(err);
    }

    const aggregationKey = opts.aggregationKey || 'Contents';
    const totalMaxObjects = opts.totalMaxObjects;

    const objects = currObjects ? currObjects.concat(data[aggregationKey])
      : data[aggregationKey];

    // if the number of results should be limited
    if (shouldPageResults(totalMaxObjects, data.IsTruncated, objects)) {
      // then callback with the paged results
      return callback(null, createPagedResults(totalMaxObjects, data.IsTruncated, objects));
    }
    // otherwise continue as normal (ie, not paged)

    if (data.IsTruncated) {
      const newExtraParams = Object.assign({},
        extraS3Params,
        { ContinuationToken: data.NextContinuationToken }
      );
      // call recursively
      return listObjectsHelper(objects, newExtraParams, opts, callback);
    }
    // else done !
    return callback(null, objects);
  });
}

function resolveCallback(resolve, reject) {
  return (err, objects) => {
    if (err) {
      reject(err);
    } else {
      resolve(objects);
    }
  };
}

function listCommonPrefixes(prefix) {
  /*
   * Returns a promise that resolves to an array of
   * the "Common Prefixes" of the S3 Objects
   * starting with the given prefix in the bucket
   * defined in the application's config.s3 object.
   */
  return new Promise((resolve, reject) => {
    listObjectsHelper(null,
      { Prefix: prefix, Delimiter: '/' },
      { aggregationKey: 'CommonPrefixes' },
      resolveCallback(resolve, reject)
    );
  });
}

function listObjects(prefix) {
  /*
   * Returns a promise that resolves to an array of
   * the S3 Objects starting with the given prefix in
   * the bucket defined in the application's config.s3 object.
   */
  return new Promise((resolve, reject) => {
    listObjectsHelper(null,
      { Prefix: prefix },
      {},
      resolveCallback(resolve, reject)
    );
  });
}

function listObjectsPaged(prefix, startAfterKey = null, totalMaxObjects = 200) {
  /*
   * Returns a promise that resolves to a potentially-truncated array of
   * the S3 Objects starting with the given prefix in
   * the bucket defined in the application's config.s3 object.
   * The object resolved by the promise will include an `isTruncated` flag
   * to indicate if the `files` array is truncated.
   */
  return new Promise((resolve, reject) => {
    const maxKeys = Math.min(S3_DEFAULT_MAX_KEYS, totalMaxObjects);

    listObjectsHelper(null,
      { Prefix: prefix, MaxKeys: maxKeys, StartAfter: startAfterKey },
      { totalMaxObjects },
      resolveCallback(resolve, reject)
    );
  });
}

module.exports = { S3_DEFAULT_MAX_KEYS, listObjects, listCommonPrefixes, listObjectsPaged };
