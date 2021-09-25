/* eslint-disable no-console */
const PromisePool = require('@supercharge/promise-pool');
const { Site, User } = require('../api/models');

async function migrateBuildNotificationSettings() {
  const users = await User.findAll({
    include: [{ model: Site }],
    paranoid: false,
  });

  const { errors } = await PromisePool
    .withConcurrency(5)
    .for(users)
    .process((user) => {
      const buildNotificationSettings = user.Sites.reduce((acc, site) => {
        const setting = site.SiteUser.buildNotificationSetting;
        return setting ? { ...acc, [site.id]: setting } : acc;
      }, {});

      return user.update({ buildNotificationSettings });
    });

  if (errors.length === 0) {
    console.log('Migrate Build Notification Settings successful!!');
    return;
  }

  errors.forEach(({ item, message }) => console.error(`${item.id}: ${message}`));

  throw new Error('Migrate Build Notification Settings completed with errors, see above for details.');
}

migrateBuildNotificationSettings()
  .then(process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
