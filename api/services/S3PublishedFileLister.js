const S3Helper = require('./S3Helper');


function listTopLevelFolders(path) {
  // Lists all top-level "folders" in the S3 bucket that start with
  // the given prefix path.

  // Pass the Delimiter option so that results are grouped
  // according to their "folder" paths
  return S3Helper.listCommonPrefixes(path)
    .then((commonPrefixes) => {
      const prefixes = commonPrefixes.map(
        prefix => prefix.Prefix.split('/').slice(-2)[0]
      );
      return prefixes;
    });
}

function listFilesPaged(path, startAtKey = null) {
  // Lists all the files in the S3 bucket that start
  // with the given prefix path.

  let prefixPath = path;
  // add a trailing slash to the prefix if not there already
  // to prevent getting files published at a repo whose name
  // is a superset of the given path name (ex: `mysite-2` and `mysite`).
  if (prefixPath[prefixPath.length - 1] !== '/') {
    prefixPath = `${prefixPath}/`;
  }

  return S3Helper.listObjectsPaged(prefixPath, startAtKey)
    .then((pagedResults) => {
      const prefixComponents = path.split('/').length;
      const files = pagedResults.objects.map((file) => {
        // convenient name for display
        const name = file.Key.split('/').slice(prefixComponents).join('/');
        const size = Number(file.Size);
        return {
          name,
          size,
          key: file.Key,
        };
      });
      return {
        isTruncated: pagedResults.isTruncated,
        files,
      };
    });
}

function listPublishedPreviews(site) {
  const previewPath = `preview/${site.owner}/${site.repository}/`;
  return listTopLevelFolders(previewPath);
}


function listPagedPublishedFilesForBranch(site, branch, startAtKey) {
  let filepath;
  if (site.defaultBranch === branch) {
    filepath = `site/${site.owner}/${site.repository}`;
  } else if (site.demoBranch === branch) {
    filepath = `demo/${site.owner}/${site.repository}`;
  } else {
    filepath = `preview/${site.owner}/${site.repository}/${branch}`;
  }
  return listFilesPaged(filepath, startAtKey);
}


module.exports = { listPublishedPreviews, listPagedPublishedFilesForBranch };
