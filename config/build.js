/*
 * Settings for the build process
 */
const envFn = require('../services/environment');

const env = envFn();

module.exports = {
  cacheControl: env.FEDERALIST_CACHE_CONTROL || 'max-age=60',
};
