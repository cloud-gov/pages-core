/* eslint-disable global-require */
function devMiddleware() {
  const rspack = require('@rspack/core');
  const webpackDevMiddleware = require('webpack-dev-middleware');

  const rspackConfig = require('../../rspack.config');

  const compiler = rspack(rspackConfig);

  return webpackDevMiddleware(compiler, {
    publicPath: rspackConfig.output.publicPath,
  });
}

module.exports = devMiddleware;
