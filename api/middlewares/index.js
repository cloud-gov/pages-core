const cacheControl = require('./cache-control');
const devMiddleware = require('./dev-middleware');
const ensureAuthenticated = require('./ensure-authenticated');
const errorHandler = require('./error-handler');
const parseJson = require('./parse-json');
const xssProtection = require('./xss-protection');

module.exports = {
  cacheControl,
  devMiddleware,
  ensureAuthenticated,
  errorHandler,
  parseJson,
  xssProtection,
};
