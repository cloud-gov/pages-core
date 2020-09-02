const userFactory = require('./user');
const { Site } = require('../../../../api/models');

let siteAttsStep = 1;

function generateUniqueAtts() {
  const res = {
    owner: `repo-owner-${siteAttsStep}`,
    repository: `repo-name-${siteAttsStep}`,
    subdomain: `siteSubDomain-${siteAttsStep}`,

  };
  siteAttsStep += 1;
  return res;
}

function makeAttributes(overrides = {}) {
  let { users } = overrides;

  if (users === undefined) {
    users = Promise.all([userFactory()]);
  }

  const { owner, repository, subdomain } = generateUniqueAtts();

  return Object.assign({
    owner,
    repository,
    engine: 'jekyll',
    s3ServiceName: 'federalist-dev-s3',
    awsBucketName: 'cg-123456789',
    awsBucketRegion: 'us-gov-west-1',
    defaultBranch: 'main',
    subdomain,
    users,
  }, overrides);
}

function site(overrides) {
  let site; // eslint-disable-line no-shadow
  let users;

  return Promise.props(makeAttributes(overrides))
    .then((attributes) => {
      users = attributes.users.slice();
      delete attributes.users; // eslint-disable-line no-param-reassign

      return Site.create(attributes);
    })
    .then((siteModel) => {
      site = siteModel;
      const userPromises = users.map(user => site.addUser(user));
      return Promise.all(userPromises);
    })
    .then(() => Site.findByPk(site.id));
}


module.exports = site;
