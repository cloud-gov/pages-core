const path = require('path');

const { getDirectoryFiles, loadAssetManifest, getSiteDisplayEnv } = require('../utils');

const CONTENT_DIR = 'content';
const CONTENT_PATH = path.join('views', CONTENT_DIR);
const TEMPLATE_EXT = 'njk';

function findContentFilePath(requestedPath, availableContentFiles) {
  return availableContentFiles.find((f) => {
    // see if there is a template file that matches the path
    if (f === `${requestedPath}.${TEMPLATE_EXT}`) {
      return true;
    }
    // see if there is an index template file that matches
    if (f === `${requestedPath}/index.${TEMPLATE_EXT}`) {
      return true;
    }
    return false;
  });
}

function cleanRequestPath(reqPath) {
  // Strips the prefixed and suffixed '/' characters
  // if they are present.
  let cleaned = reqPath;

  if (cleaned[0] === '/') {
    cleaned = cleaned.substr(1);
  }

  if (cleaned[cleaned.length - 1] === '/') {
    cleaned = cleaned.substr(0, cleaned.length - 1);
  }

  return cleaned;
}

// get a list of all available content files upon this module being loaded
const availableContentFiles = getDirectoryFiles(CONTENT_PATH)
  .map(fp => path.relative(CONTENT_PATH, fp));

let webpackAssets = loadAssetManifest();

module.exports = {
  serve(req, res) {
    const reqPath = cleanRequestPath(req.path);

    // try to find a content template file matching the requested path
    const contentFilePath = findContentFilePath(reqPath, availableContentFiles);

    if (!contentFilePath) {
      return res.status(404).send('Not Found');
    }

    if (process.env.NODE_ENV === 'development') {
      // reload the webpack assets during development so we don't have to
      // restart the server for front end changes
      webpackAssets = loadAssetManifest();
    }

    const siteDisplayEnv = getSiteDisplayEnv();

    const context = {
      webpackAssets,
      siteDisplayEnv,
    };

    return res.render(path.join(CONTENT_DIR, contentFilePath), context);
  },
};
