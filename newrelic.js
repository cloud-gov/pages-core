/**
 * New Relic agent configuration.
 *
 * This file is require'd by the new relic lib, not directly by our code.
 *
 * See node_modules/lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
const config = require('./config');

exports.config = {
  // Grab NEW_RELIC_APP_NAME and NEW_RELIC_LICENSE_KEY from the cloud.gov
  // user-provided service
  app_name: [config.env.newRelicAppName],
  host: 'gov-collector.newrelic.com',
  license_key: config.env.newRelicLicenseKey,
  logging: {
    level: 'info',
  },
  // Comma-delimited list of HTTP status codes for the error collector to ignore
  // We ignore 403 errors because they are expected for unauthenticated users
  error_collector: { ignore_status_codes: [404, 403] },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },
};
