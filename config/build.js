/*
 * Settings the build process
 */
var envFn = require('../services/environment.js');
var env = envFn();

module.exports.build = {
  cacheControl: env.FEDERALIST_CACHE_CONTROL || 'max-age=60',
  callback: env.FEDERALIST_BUILD_CALLBACK || 'http://localhost:1337/build/status/',
  token: env.FEDERALIST_BUILD_TOKEN,
}
