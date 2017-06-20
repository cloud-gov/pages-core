const fs = require('fs');
const path = require('path');

const SiteWideErrorLoader = require('../services/SiteWideErrorLoader');
const config = require('../../config');

function loadAssetManifest() {
  const manifestPath = path.join(__dirname, '..', '..', 'webpack-manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

let webpackAssets = loadAssetManifest();

module.exports = {
  index(req, res) {
    if (process.env.NODE_ENV === 'development') {
      // reload the webpack assets during development so we don't have to
      // restart the server for front end changes
      webpackAssets = loadAssetManifest();
    }

    const siteDisplayEnv = config.app.app_env !== 'production' ? config.app.app_env : null;

    const context = {
      siteWideError: null,
      jsBundleName: webpackAssets['main.js'],
      cssBundleName: webpackAssets['main.css'],
      siteDisplayEnv,
    };

    if (req.session.authenticated) {
      context.siteWideError = SiteWideErrorLoader.loadSiteWideError();
    }

    res.render('index.html', context);
  },
};
