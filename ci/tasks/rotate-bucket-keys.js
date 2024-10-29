const cfenv = require('cfenv');
const { rotateSitesBucketKeys } = require('../../api/services/SiteBucketKeyRotator');

function logSuccess(fulfilled) {
  // eslint-disable-next-line
  console.log('Successfully rotated site keys:\n');

  // eslint-disable-next-line
  for (let i = 0; i < fulfilled.length; i++) {
    const site = fulfilled[i].value.dataValues;
    // eslint-disable-next-line
    console.log(`Updated Site: ${site.id} - ${site.owner}/${site.repository}`);
  }
}

async function main() {
  const appEnv = cfenv.getAppEnv();
  const apiCredentials = appEnv.getServiceCreds('federalist-deploy-user');

  const rotatedKeyServices = await rotateSitesBucketKeys({
    username: apiCredentials.DEPLOY_USER_USERNAME,
    password: apiCredentials.DEPLOY_USER_PASSWORD,
  });

  const rejected = rotatedKeyServices.filter((result) => result.status === 'rejected');

  const fulfilled = rotatedKeyServices.filter((result) => result.status === 'fulfilled');

  if (rejected.length > 0) {
    logSuccess(fulfilled);
    // eslint-disable-next-line
    console.error('Failed to rotate site keys:\n');
    // eslint-disable-next-line
    console.error(rejected);
    process.exit(1);
  }

  logSuccess(fulfilled);
  process.exit(0);
}

main();
