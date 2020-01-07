/* eslint-disable no-console */
const inquirer = require('inquirer');

const cleanDatabase = require('../api/utils/cleanDatabase');
const {
  ActionType,
  Build,
  BuildLog,
  Site,
  User,
  UserAction,
} = require('../api/models');

const confirm = {
  type: 'confirm',
  default: false,
  name: 'userAgrees',
  message: 'This will DELETE all data in your development database. Are you sure you want to continue?',
};

// questions to collect necessary info to bootstrap the db
const questions = [{
  type: 'input',
  name: 'githubUsername',
  message: 'What is your GitHub username?',
}];

inquirer.prompt(confirm)
  .then(async ({ userAgrees }) => {
    // exit if the user did not agree to the confirmation
    if (!userAgrees) {
      console.log('Exiting without making any changes.');
      process.exit();
    }

    const { githubUsername } = await inquirer.prompt(questions);

    console.log('Cleaning database...');
    await cleanDatabase();

    console.log('Creating default action types...');
    await ActionType.createDefaultActionTypes();

    console.log('Creating users...');
    const user1 = await User.create({
      username: githubUsername,
      email: `${githubUsername}@example.com`,
    });

    const user2 = await User.create({
      username: 'fake-user',
      email: 'fake-user@example.com',
      githubAccessToken: 'fake-access-token',
      githubUserId: 123456,
    });

    console.log('Creating sites...');
    const site1 = await Site.create({
      demoBranch: 'demo-branch',
      demoDomain: 'https://demo.example.gov',
      defaultBranch: 'master',
      domain: 'https://example.gov',
      engine: 'jekyll',
      owner: user1.username,
      repository: 'example-site',
      s3ServiceName: 'federalist-dev-s3',
      awsBucketName: 'cg-123456789',
      awsBucketRegion: 'us-gov-west-1',
    });

    await Promise.all([
      site1.addUser(user1.id),
      site1.addUser(user2.id),
    ]);

    console.log('Creating builds...');
    const builds = await Promise.all([
      Build.create({
        branch: site1.defaultBranch,
        completedAt: new Date(),
        source: 'fake-build',
        state: 'success',
        site: site1.id,
        user: user1.id,
        token: 'fake-token',
      }),
      Build.create({
        branch: site1.defaultBranch,
        source: 'fake-build',
        site: site1.id,
        user: user1.id,
        token: 'fake-token',
      }).then(build => build.update({ commitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe1' })),
      Build.create({
        branch: site1.demoBranch,
        source: 'fake-build',
        site: site1.id,
        user: user1.id,
        token: 'fake-token',
        state: 'error',
        error: 'Something bad happened here',
        completedAt: new Date(),
      }).then(build => build.update({ commitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe2' })),
    ]);

    console.log('Creating build logs...');
    await Promise.all(builds.map(build => BuildLog.create({
      output: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Nullam fringilla, arcu ut ultricies auctor, elit quam
              consequat neque, eu blandit metus lorem non turpis.
              Ut luctus nec turpis pellentesque dignissim. Vivamus
              porttitor tellus turpis, a tempor velit tincidunt at.
              Aenean laoreet nulla ut porta semper.`.replace(/\s\s+/g, ' '),
      source: 'fake-build-step',
      build: build.id,
    })));

    // create a useraction of removing the other user
    const removeAction = await ActionType.findOne({ where: { action: 'remove' } });
    await UserAction.create({
      userId: user1.id,
      targetId: user2.id,
      targetType: 'user',
      actionId: removeAction.id,
      siteId: site1.id,
    });

    console.log('Done!');
    console.log('You may have to log out and then back in to your local development instance of Federalist.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Uh oh, we have a problem!');
    console.error(error);
    process.exit(1);
  });
