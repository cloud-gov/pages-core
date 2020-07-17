const cfenv = require('cfenv');

const appEnv = cfenv.getAppEnv();
const env = process.env.APP_ENV || 'development';
const serviceCredsKey = `federalist-${env.toLowerCase()}-env`;
const federalistCreds = appEnv.getServiceCreds(serviceCredsKey) || {};

module.exports = (key) => {
  const creds = key ? appEnv.getServiceCreds(key) : federalistCreds;
  return { ...process.env, ...creds };
};
