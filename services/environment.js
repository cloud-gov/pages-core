var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var env = process.env.NODE_ENV || 'development';
var serviceCredsKey = 'federalist-' + env.toLowerCase() + '-env';
var federalistCreds = appEnv.getServiceCreds(serviceCredsKey) || {};

module.exports = function() {
  return Object.assign({}, process.env, federalistCreds);
};
