const fs = require('fs');
const path = require('path');

const moment = require('moment');
const logger = require('winston');

const config = require('../../config');

function isPastAuthThreshold(authDate) {
  return moment().isAfter(
    moment(authDate).add(config.policies.authRevalidationMinutes, 'minutes')
  );
}

function getDirectoryFiles(dir, existingFileList) {
  let fileList = existingFileList || [];
  fs.readdirSync(dir).forEach((file) => {
    fileList = fs.statSync(path.join(dir, file)).isDirectory()
      ? getDirectoryFiles(path.join(dir, file), fileList)
      : fileList.concat(path.join(dir, file));
  });
  return fileList;
}

function loadAssetManifest() {
  const manifestFile = 'webpack-manifest.json';
  if (!fs.existsSync(manifestFile)) {
    logger.error('webpack-manifest.json does not exist. Have you run webpack (`yarn build`)?');
    throw new Error();
  }
  return JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
}

function getSiteDisplayEnv() {
  if (config.app.app_env !== 'production') {
    return config.app.app_env;
  }
  return null;
}

function shouldIncludeTracking() {
  return config.app.app_env === 'production';
}

module.exports = {
  getDirectoryFiles,
  getSiteDisplayEnv,
  isPastAuthThreshold,
  loadAssetManifest,
  shouldIncludeTracking,
};
