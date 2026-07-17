const cfenv = require('cfenv');
const { requiredEnvVarsCi } = require('../../config/envVarValidator');

function main() {
  const appEnv = cfenv.getAppEnv();
  const apiCredentials = appEnv.getServiceCreds(`pages-${process.env.APP_ENV}-env`);

  let missing = [];
  requiredEnvVarsCi.forEach((envVar) => {
    if (!apiCredentials[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0) {
    // eslint-disable-next-line
    console.error('Env variables are not initialized:\n');
    // eslint-disable-next-line
    console.error(missing);
    process.exit(1);
  }

  // eslint-disable-next-line
  console.log('All env variables are initialized:\n');
  // eslint-disable-next-line
  console.log(requiredEnvVarsCi);
  process.exit(0);
}

main();
