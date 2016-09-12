var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var env = process.env.NODE_ENV;
var serviceCredsKey = 'federalist-' + env.toLowerCase() + '-env';
var federalistCreds = appEnv.getServiceCreds(serviceCredsKey) || {};

module.exports = function getCreds() {
  return Object.assign({}, process.env, federalistCreds);
};
