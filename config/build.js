/*
 * Settings the build process
 */
var envFn = require('../services/environment.js');
var env = envFn();

module.exports.build = {
  cacheControl: env.FEDERALIST_CACHE_CONTROL || 'max-age=60',
  statusCallback: env.FEDERALIST_BUILD_STATUS_CALLBACK || 'http://localhost:1337/v0/build/:build_id/status/:token',
  logCallback: env.FEDERALIST_BUILD_LOG_CALLBACK || 'http://localhost:1337/v0/build/:build_id/log/:token',
}
