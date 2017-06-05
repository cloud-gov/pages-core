const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', '..', 'webpack-assets.json');
const webpackAssets = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

module.exports = {
  index(req, res) {
    res.render('index.html', {
      jsBundleName: webpackAssets.main.js,
      cssBundleName: webpackAssets.main.css,
    });
  },
};
