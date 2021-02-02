/* eslint-disable no-console */
const inquirer = require('inquirer');
Promise.props = require('promise-props');
const BuildLogs = require('../api/services/build-logs');
const EventCreator = require('../api/services/EventCreator');
const cleanDatabase = require('../api/utils/cleanDatabase');
const {
  ActionType,
  Build,
  BuildLog,
  Event,
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

function memberAddedPayload() {
  return {
    action: 'member_added',
    sender: {
      id: 693815, url: 'https://api.github.com/users/apburnes', type: 'User', login: 'apburnes', node_id: 'MDQ6VXNlcjY5MzgxNQ==', html_url: 'https://github.com/apburnes', gists_url: 'https://api.github.com/users/apburnes/gists{/gist_id}', repos_url: 'https://api.github.com/users/apburnes/repos', avatar_url: 'https://avatars.githubusercontent.com/u/693815?v=4', events_url: 'https://api.github.com/users/apburnes/events{/privacy}', site_admin: false, gravatar_id: '', starred_url: 'https://api.github.com/users/apburnes/starred{/owner}{/repo}', followers_url: 'https://api.github.com/users/apburnes/followers', following_url: 'https://api.github.com/users/apburnes/following{/other_user}', organizations_url: 'https://api.github.com/users/apburnes/orgs', subscriptions_url: 'https://api.github.com/users/apburnes/subscriptions', received_events_url: 'https://api.github.com/users/apburnes/received_events',
    },
    membership: {
      url: 'https://api.github.com/orgs/federalist-users/memberships/maryclair',
      role: 'member',
      user: {
        id: 32960241, url: 'https://api.github.com/users/maryclair', type: 'User', login: 'maryclair', node_id: 'MDQ6VXNlcjMyOTYwMjQx', html_url: 'https://github.com/maryclair', gists_url: 'https://api.github.com/users/maryclair/gists{/gist_id}', repos_url: 'https://api.github.com/users/maryclair/repos', avatar_url: 'https://avatars.githubusercontent.com/u/32960241?v=4', events_url: 'https://api.github.com/users/maryclair/events{/privacy}', site_admin: false, gravatar_id: '', starred_url: 'https://api.github.com/users/maryclair/starred{/owner}{/repo}', followers_url: 'https://api.github.com/users/maryclair/followers', following_url: 'https://api.github.com/users/maryclair/following{/other_user}', organizations_url: 'https://api.github.com/users/maryclair/orgs', subscriptions_url: 'https://api.github.com/users/maryclair/subscriptions', received_events_url: 'https://api.github.com/users/maryclair/received_events',
      },
      state: 'pending',
      organization_url: 'https://api.github.com/orgs/federalist-users',
    },
    organization: {
      id: 14109682, url: 'https://api.github.com/orgs/federalist-users', login: 'federalist-users', node_id: 'MDEyOk9yZ2FuaXphdGlvbjE0MTA5Njgy', hooks_url: 'https://api.github.com/orgs/federalist-users/hooks', repos_url: 'https://api.github.com/orgs/federalist-users/repos', avatar_url: 'https://avatars.githubusercontent.com/u/14109682?v=4', events_url: 'https://api.github.com/orgs/federalist-users/events', issues_url: 'https://api.github.com/orgs/federalist-users/issues', description: 'federalist.18f.gov Users', members_url: 'https://api.github.com/orgs/federalist-users/members{/member}', public_members_url: 'https://api.github.com/orgs/federalist-users/public_members{/member}',
    },
  };
}

function socketIOError() {
  return {
    error: "AbortError: PUBLISH can't be processed. The connection is already closed.\n at handle_offline_command (/home/vcap/app/node_modules/redis/index.js:779:15)\n at RedisClient.internal_send_command (/home/vcap/app/node_modules/redis/index.js:813:9)\n at RedisClient.publish (/home/vcap/app/node_modules/redis/lib/commands.js:46:25)\n at RedisAdapter.broadcast (/home/vcap/app/node_modules/socket.io-redis/dist/index.js:265:28)\n at Namespace.emit (/home/vcap/app/node_modules/socket.io/dist/namespace.js:175:22)\n at Server.<computed> [as emit] (/home/vcap/app/node_modules/socket.io/dist/index.js:445:33)\n at emitBuildStatus (/home/vcap/app/api/controllers/build.js:32:30)\n at runMicrotasks (<anonymous>)\n at processTicksAndRejections (internal/process/task_queues.js:93:5)",
    message: 'redisAdapter pubClient error',
  };
}

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
      username: user1.username,
      token: 'fake-token',
    }),
    Build.create({
      branch: site1.defaultBranch,
      source: 'fake-build',
      site: site1.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
    }).then(build => build.update({ commitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe1' })),
    Build.create({
      branch: site1.demoBranch,
      source: 'fake-build',
      site: site1.id,
      user: user1.id,
      username: user1.username,
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
      username: user1.username,
      token: 'fake-token',
    }),
    Build.create({
      branch: nodeSite.defaultBranch,
      completedAt: new Date(),
      source: 'fake-build',
      state: 'error',
      site: nodeSite.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
      error: 'The build timed out',
    }),
    Build.create({
      branch: 'dc/fixes',
      source: 'fake-build',
      site: nodeSite.id,
      user: user1.id,
      username: user1.username,
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
      username: user1.username,
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
    Array(1000).fill(0).map((_v, idx) => ({
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

  console.log('Uploading logs to S3');
  try {
    await BuildLogs.archiveBuildLogs(nodeSite, nodeSiteBuilds[0]);
  } catch (error) {
    console.error('Failed to upload logs to S3, probably because the credentials are not configured locally. This can be ignored.');
  }

  console.log('Creating Events');
  await Promise.all([
    EventCreator.audit(Event.labels.AUTHENTICATION, user1, 'UAA login'),
    EventCreator.audit(Event.labels.AUTHENTICATION, user2, 'UAA login'),
    EventCreator.audit(Event.labels.AUTHENTICATION, user1, 'member_added', memberAddedPayload()),
  ]);

  console.log('Creating Admin Users');
  await Promise.all([
    User.upsert({ username: 'amirbey', email: 'amirbey@example.com', adminEmail: 'amir.reavis-bey@gsa.gov' }),
    User.upsert({ username: 'apburnes', email: 'apburnes@example.com', adminEmail: 'andrew.burnes@gsa.gov' }),
    User.upsert({ username: 'davemcorwin', email: 'davemcorwin@example.com', adminEmail: 'david.corwin@gsa.gov' }),
  ]);

  console.log('Crearing Error Events');
  await Promise.all([
    EventCreator.error(Event.labels.REQUEST_HANDLER, new Error('A sample error'), { some: 'info' }),
    EventCreator.error(Event.labels.REQUEST_HANDLER, socketIOError, { some: 'info' }),
  ]);
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
