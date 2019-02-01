const path = require('path');

const BuildCounter = require('../services/BuildCounter');
const { getDirectoryFiles, loadAssetManifest, getSiteDisplayEnv, shouldIncludeTracking } = require('../utils');

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

let webpackAssets = loadAssetManifest();

module.exports = {
  serve(req, res) {
    const reqPath = cleanRequestPath(req.path);

    // walk the static content directory and create an array of content files
    const availableContentFiles = getDirectoryFiles(CONTENT_PATH)
      .map(fp => path.relative(CONTENT_PATH, fp));

    // try to find a content template file matching the requested path
    const contentFilePath = findContentFilePath(reqPath, availableContentFiles);

    if (!contentFilePath) {
      res.status(404).send('Not Found');
      return;
    }

    const context = {
      webpackAssets,
      siteDisplayEnv: getSiteDisplayEnv(),
      shouldIncludeTracking: shouldIncludeTracking(),
    };

    BuildCounter.countBuildsFromPastWeek()
      .then((count) => {
        context.buildCount = count;
        return res.render(path.join(CONTENT_DIR, contentFilePath), context);
      });
  },
};
