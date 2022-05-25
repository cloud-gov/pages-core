const cacheControl = require('./cache-control');
const csrfProtection = require('./csrf-protection');
const devMiddleware = require('./dev-middleware');
const ensureAuthenticated = require('./ensure-authenticated');
const ensureOrigin = require('./ensure-origin');
const errorHandler = require('./error-handler');
const fourOhFourHandler = require('./four-oh-four-handler');
const parseForm = require('./parse-form');
const parseJson = require('./parse-json');
const sessionAuth = require('./session-auth');
const xssProtection = require('./xss-protection');

module.exports = {
  cacheControl,
  csrfProtection,
  devMiddleware,
  ensureAuthenticated,
  ensureOrigin,
  errorHandler,
  fourOhFourHandler,
  parseForm,
  parseJson,
  sessionAuth,
  xssProtection,
};
