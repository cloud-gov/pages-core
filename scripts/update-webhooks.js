/* eslint-disable no-console */
const { resetWebhook } = require('../api/services/Webhooks');
const { Site } = require('../api/models');
const [, , ...args] = process.argv;
const platformArg = args[0];

async function getSitesByPlatform(platform) {
  const isValidPlatform = Object.values(Site.Platforms).find(
    (v) => v === platform.toLowerCase(),
  );

  if (!isValidPlatform) {
    throw Error(
      `Invalid source code platform ${platform}.
      It should be ${Object.values(Site.Platforms).join(' or ')}`,
    );
  }

  return Site.findAll({
    where: {
      sourceCodePlatform: platform,
    },
  });
}

async function run(platform) {
  if (!platform) {
    throw Error(
      'Please pass a plaform argument. Ie. node ./scripts/update-webhooks.js github',
    );
  }
  console.log(`Running webhook migrations for ${platform}`);

  const sites = await getSitesByPlatform(platform);

  return Promise.allSettled(
    sites.map(async (site) => {
      console.log(
        `Rotating Webhooks for site ${site.id}: ${site.owner}/${site.repository}`,
      );
      await resetWebhook(site.id);
      console.log(`Completed Webhook Rotation\n\n`);
    }),
  );
}

run(platformArg)
  .then((results) => {
    const successes = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);

    const failures = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);

    console.log(`Rotated ${successes.length} source code webhooks successfully`);

    if (failures.length > 0) {
      console.log(`Failed to rotate ${failures.length} source code webhooks.`);

      for (let failure of failures) {
        console.log(`Fail Message: ${failure}`);
      }
    }

    process.exit(0);
  })
  .catch((err) => {
    console.log(`Error: ${err}`);
    process.exit(1);
  });
