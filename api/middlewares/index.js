const authorize = require('./authorize');
const cacheControl = require('./cache-control');
const csrfProtection = require('./csrf-protection');
const ensureAuthenticated = require('./ensure-authenticated');
const ensureOrigin = require('./ensure-origin');
const errorHandler = require('./error-handler');
const fourOhFourHandler = require('./four-oh-four-handler');
const multipartForm = require('./mulipart-form');
const parseForm = require('./parse-form');
const parseJson = require('./parse-json');
const sessionAuth = require('./session-auth');
const xssProtection = require('./xss-protection');

module.exports = {
  authorize,
  cacheControl,
  csrfProtection,
  ensureAuthenticated,
  ensureOrigin,
  errorHandler,
  fourOhFourHandler,
  multipartForm,
  parseForm,
  parseJson,
  sessionAuth,
  xssProtection,
};
