const cfenv = require('cfenv');

const appEnv = cfenv.getAppEnv();

const { space_name: spaceName } = appEnv.app;

const servicePrefix = spaceName === 'pages-staging' ? spaceName : `federalist-${process.env.APP_ENV}`;

const serviceCredsKey = `${servicePrefix}-env`;
const federalistCreds = appEnv.getServiceCreds(serviceCredsKey) || {};

module.exports = (key) => {
  const creds = key ? appEnv.getServiceCreds(key) : federalistCreds;
  return { ...process.env, ...creds };
};
