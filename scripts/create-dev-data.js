/* eslint-disable no-console */
const inquirer = require('inquirer');
Promise.props = require('promise-props');

const cleanDatabase = require('../api/utils/cleanDatabase');
const {
  ActionType,
  Build,
  BuildLog,
  User,
  UserAction,
} = require('../api/models');
const { site: siteFactory } = require('../test/api/support/factory');

const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  Nullam fringilla, arcu ut ultricies auctor, elit quam
  consequat neque, eu blandit metus lorem non turpis.
  Ut luctus nec turpis pellentesque dignissim. Vivamus
  porttitor tellus turpis, a tempor velit tincidunt at.
  Aenean laoreet nulla ut porta semper.
`.replace(/\s\s+/g, ' ');

const log = msg => `${(new Date()).toUTCString()} INFO [main] - ${msg}`;

async function createData({ githubUsername }) {
  console.log('Cleaning database...');
  await cleanDatabase();

  console.log('Creating default action types...');
  await ActionType.createDefaultActionTypes();

  console.log('Creating users...');
  const [user1, user2] = await Promise.all([
    User.create({
      username: githubUsername,
      email: `${githubUsername}@example.com`,
    }),

    User.create({
      username: 'fake-user',
      email: 'fake-user@example.com',
      githubAccessToken: 'fake-access-token',
      githubUserId: 123456,
    }),

    User.create({
      username: process.env.USER_AUDITOR,
      email: 'fake-user@example.com',
    }),
  ]);

  console.log('Creating sites...');
  const [site1, nodeSite, goSite] = await Promise.all([
    siteFactory({
      demoBranch: 'demo-branch',
      demoDomain: 'https://demo.example.gov',
      domain: 'https://example.gov',
      owner: user1.username,
      repository: 'example-site',
      users: [user1, user2],
    }),

    siteFactory({
      engine: 'node.js',
      owner: user1.username,
      repository: 'example-node-site',
      users: [user1],
    }),

    siteFactory({
      engine: 'hugo',
      owner: user1.username,
      repository: 'example-go-site',
      users: [user1],
    }),
  ]);

  console.log('Creating builds...');
  const site1Builds = await Promise.all([
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

  const nodeSiteBuilds = await Promise.all([
    Build.create({
      branch: nodeSite.defaultBranch,
      completedAt: new Date(),
      source: 'fake-build',
      state: 'success',
      site: nodeSite.id,
      user: user1.id,
      token: 'fake-token',
    }),
    Build.create({
      branch: nodeSite.defaultBranch,
      completedAt: new Date(),
      source: 'fake-build',
      state: 'error',
      site: nodeSite.id,
      user: user1.id,
      token: 'fake-token',
      error: 'The build timed out',
    }),
    Build.create({
      branch: 'dc/fixes',
      source: 'fake-build',
      site: nodeSite.id,
      user: user1.id,
      token: 'fake-token',
    }).then(build => build.update({ commitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe1' })),
  ]);

  const goSiteBuilds = await Promise.all([
    Build.create({
      branch: goSite.defaultBranch,
      completedAt: new Date(),
      source: 'fake-build',
      state: 'success',
      site: goSite.id,
      user: user1.id,
      token: 'fake-token',
    }),
  ]);

  console.log('Creating build logs...');
  await BuildLog.bulkCreate([
    {
      output: loremIpsum,
      source: 'fake-build-step1',
      build: site1Builds[0].id,
    },
    {
      output: loremIpsum,
      source: 'fake-build-step2',
      build: site1Builds[0].id,
    },
    {
      output: loremIpsum,
      source: 'fake-build-step1',
      build: site1Builds[1].id,
    },
    {
      output: loremIpsum,
      source: 'fake-build-step1',
      build: site1Builds[2].id,
    },
    {
      output: log('This log should not be visible'),
      source: 'fake-build-step1',
      build: nodeSiteBuilds[0].id,
    },
  ]);

  await BuildLog.bulkCreate(
    Array(20).fill(0).map(() => ({
      output: log('This log has a source of ALL'),
      source: 'ALL',
      build: nodeSiteBuilds[0].id,
    }))
  );

  await BuildLog.bulkCreate(
    Array(2000).fill(0).map((_v, idx) => ({
      output: log(`Message ${idx} - A much longer log message to test that the horizontal scrolling is working the way we want.`),
      source: 'ALL',
      build: goSiteBuilds[0].id,
    }))
  );

  console.log('Creating user actions...');
  const removeAction = await ActionType.findOne({ where: { action: 'remove' } });
  await UserAction.create({
    userId: user1.id,
    targetId: user2.id,
    targetType: 'user',
    actionId: removeAction.id,
    siteId: site1.id,
  });
}

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
  .then(({ userAgrees }) => {
    // exit if the user did not agree to the confirmation
    if (!userAgrees) {
      console.log('Exiting without making any changes.');
      process.exit();
    }
  })
  .then(() => inquirer.prompt(questions))
  .then(createData)
  .then(() => {
    console.log('Done!');
    console.log('You may have to log out and then back in to your local development instance of Federalist.');
    process.exit();
  })
  .catch((error) => {
    console.error('Uh oh, we have a problem!');
    console.error(error);
    process.exit(1);
  });
