/*
 * Settings the build process
 */
const envFn = require('../services/environment.js');

const env = envFn();

module.exports = {
  cacheControl: env.FEDERALIST_CACHE_CONTROL || 'max-age=60',
};
