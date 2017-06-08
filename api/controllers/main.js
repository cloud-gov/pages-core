const fs = require('fs');
const path = require('path');
const SiteWideErrorLoader = require('../services/SiteWideErrorLoader');

const manifestPath = path.join(__dirname, '..', '..', 'webpack-manifest.json');
const webpackAssets = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

module.exports = {
  index(req, res) {
    const context = {
      siteWideError: null,
      jsBundleName: webpackAssets['main.js'],
      cssBundleName: webpackAssets['main.css'],
    };

    if (req.session.authenticated) {
      context.siteWideError = SiteWideErrorLoader.loadSiteWideError();
    }

    res.render('index.html', context);
  },
};
