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

  robots(req, res) {
    const PROD_CONTENT = 'User-Agent: *\nDisallow: /preview\n';
    const DENY_ALL_CONTENT = 'User-Agent: *\nDisallow: /\n';

    res.set('Content-Type', 'text/plain');

    // If this is the production instance and the request came to the production hostname
    if (config.app.app_env === 'production' &&
      config.app.hostname === `${req.protocol}://${req.hostname}`) {
      // then send the production robots.txt content
      return res.send(PROD_CONTENT);
    }

    // otherwise send the "deny all" robots.txt content
    return res.send(DENY_ALL_CONTENT);
  },
};
