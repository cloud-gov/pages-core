/* eslint-disable global-require */
function devMiddleware() {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');

  const webpackConfig = require('../../webpack.config');

  const compiler = webpack(webpackConfig);

  return webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
  });
}

module.exports = devMiddleware;
