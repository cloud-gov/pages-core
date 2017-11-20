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
  return new Promise((resolve, reject) => {
    s3Client.listObjects({
      Bucket: s3Config.bucket,
      Prefix: path,
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const prefixComponents = path.split('/').length;
        const files = data.Contents.map((object) => {
          const name = object.Key.split('/').slice(prefixComponents).join('/');
          const size = Number(object.Size);
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
