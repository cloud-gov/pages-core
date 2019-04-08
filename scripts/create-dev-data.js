const inquirer = require('inquirer');

const cleanDatabase = require('../api/utils/cleanDatabase');
const { ActionType, Build, BuildLog, Site, User, UserAction } = require('../api/models');

const confirm = {
  type: 'confirm',
  default: false,
  name: 'userAgrees',
  message: 'This will DELETE all data in your development database. Are you sure you want to continue?',
};

function createSite(user, params) {
  return Site.create(params)
    .then(site => site.addUser(user.id).then(() => site));
}

inquirer.prompt(confirm).then(({ userAgrees }) => {
  // exit if the user did not agree to the confirmation
  if (!userAgrees) {
    // eslint-disable-next-line no-console
    console.log('Exiting without making any changes.');
    process.exit();
  }

  // questions to collect necessary info to bootstrap the db
  const questions = [{
    type: 'input',
    name: 'githubUsername',
    message: 'What is your GitHub username?',
  }];

  inquirer.prompt(questions).then(({ githubUsername }) => {
    const thisUserId = 1;
    const thisSiteId = 1;

    cleanDatabase()
      .then(() => ActionType.createDefaultActionTypes())
      // create a user for the given github username
      .then(() => User.create({
        id: thisUserId,
        username: githubUsername,
        email: `${githubUsername}@example.com`,
      }))
      // create a site for the user
      .then(thisUser => createSite(thisUser, {
        id: thisSiteId,
        demoBranch: 'demo-branch',
        demoDomain: 'https://demo.example.gov',
        defaultBranch: 'master',
        domain: 'https://example.gov',
        engine: 'jekyll',
        owner: thisUser.username,
        repository: 'example-site',
      }))
      // create a build for the site
      .then(site => Promise.all([
        Build.create({
          branch: site.defaultBranch,
          completedAt: new Date(),
          source: 'fake-build',
          state: 'success',
          site: site.id,
          user: thisUserId,
          token: 'fake-token',
        }),
        Build.create({
          branch: site.defaultBranch,
          source: 'fake-build',
          site: site.id,
          user: thisUserId,
          token: 'fake-token',
        }).then(build => build.update({ commitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe1' })),
        Build.create({
          branch: site.demoBranch,
          source: 'fake-build',
          site: site.id,
          user: thisUserId,
          token: 'fake-token',
          state: 'error',
          error: 'Something bad happened here',
          completedAt: new Date(),
        }).then(build => build.update({ commitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe2' })),
      ]))
      // create a build log for the build
      .then(builds => builds.map(build => BuildLog.create({
        output: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                 Nullam fringilla, arcu ut ultricies auctor, elit quam
                 consequat neque, eu blandit metus lorem non turpis.
                 Ut luctus nec turpis pellentesque dignissim. Vivamus
                 porttitor tellus turpis, a tempor velit tincidunt at.
                 Aenean laoreet nulla ut porta semper.`.replace(/\s\s+/g, ' '),
        source: 'fake-build-step',
        build: build.id,
      })))
      // create another user
      .then(() => User.create({
        id: 2,
        username: 'fake-user',
        email: 'fake-user@example.com',
        githubAccessToken: 'fake-access-token',
        githubUserId: 123456,
      }))
      // add the other user to example site
      .then(fakeUser =>
        fakeUser.addSite(thisSiteId).then(() => fakeUser)
      )
      // create a useraction of removing the other user
      .then(fakeUser =>
        ActionType
          .findOne({ where: { action: 'remove' } })
          .then(removeAction =>
            UserAction.create({
              userId: thisUserId,
              targetId: fakeUser.id,
              targetType: 'user',
              actionId: removeAction.id,
              siteId: thisSiteId,
            })
        )
    )
    .then(() => {
      /* eslint-disable no-console */
      console.log('Done!');
      console.log('You may have to log out and then back in to your local development instance of Federalist.');
      /* eslint-enable no-console */
      process.exit();
    });
  });
});
