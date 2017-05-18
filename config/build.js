/*
 * Settings the build process
 */
var envFn = require('../services/environment.js');
var env = envFn();

module.exports = {
  cacheControl: env.FEDERALIST_CACHE_CONTROL || 'max-age=60',
}
