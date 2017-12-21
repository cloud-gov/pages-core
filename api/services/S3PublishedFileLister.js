const AWS = require('aws-sdk');
const config = require('../../config');

const s3Config = config.s3;
const s3Client = new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region,
});

function listFolders(path) {
  return new Promise((resolve, reject) => {
    s3Client.listObjects({
      Bucket: s3Config.bucket,
      Prefix: path,
      Delimiter: '/',
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const prefixes = data.CommonPrefixes.map(
          prefix => prefix.Prefix.split('/').slice(-2)[0]
        );
        resolve(prefixes);
      }
    }
    );
  });
}


function listFiles(path) {
  let prefixPath = path;
  // add a trailing slash to the prefix if not there already
  // to prevent getting files published at a repo whose name
  // is a superset of the given path name (ex: `mysite-2` and `mysite`).
  if (prefixPath[prefixPath.length - 1] !== '/') {
    prefixPath = `${prefixPath}/`;
  }

  const listFilesHelper = (currFiles, continuationToken, callback) => {
    const listObjectArgs = {
      Bucket: s3Config.bucket,
      Prefix: prefixPath,
    };

    if (continuationToken) {
      listObjectArgs.ContinuationToken = continuationToken;
    }

    s3Client.listObjectsV2(listObjectArgs, (err, data) => {
      if (err) {
        callback(err);
        return;
      }

      const files = currFiles ? currFiles.concat(data.Contents) : data.Contents;

      if (data.IsTruncated) {
        listFilesHelper(files, data.NextContinuationToken, callback);
      } else {
        // done !
        callback(null, files);
      }
    });
  };

  return new Promise((resolve, reject) => {
    listFilesHelper(null, null, (err, fileObjects) => {
      if (err) {
        reject(err);
      } else {
        const prefixComponents = path.split('/').length;
        const files = fileObjects.map((file) => {
          const name = file.Key.split('/').slice(prefixComponents).join('/');
          const size = Number(file.Size);
          return { name, size };
        });
        resolve(files);
      }
    });
  });
}


function listPublishedPreviews(site) {
  const previewPath = `preview/${site.owner}/${site.repository}/`;
  return listFolders(previewPath);
}


function listPublishedFilesForBranch(site, branch) {
  let filepath;
  if (site.defaultBranch === branch) {
    filepath = `site/${site.owner}/${site.repository}`;
  } else if (site.demoBranch === branch) {
    filepath = `demo/${site.owner}/${site.repository}`;
  } else {
    filepath = `preview/${site.owner}/${site.repository}/${branch}`;
  }
  return listFiles(filepath);
}


module.exports = { listPublishedPreviews, listPublishedFilesForBranch };
