/* eslint-disable global-require */
module.exports = () => {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackConfig = require('../../webpack.development.config');
  const compiler = webpack(webpackConfig);

  return webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
  });
};
