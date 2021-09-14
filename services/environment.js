const cfenv = require('cfenv');

const { APP_ENV, PRODUCT } = process.env;
const appEnv = cfenv.getAppEnv();

const productPrefix = `${PRODUCT}-${APP_ENV}`;

const serviceCredsKey = `${productPrefix}-env`;
const federalistCreds = appEnv.getServiceCreds(serviceCredsKey) || {};

module.exports = (key) => {
  const creds = key ? appEnv.getServiceCreds(key) : federalistCreds;
  return { ...process.env, ...creds };
};
