const userFactory = require('./user');
const { Site } = require('../../../../api/models');
const { generateSubdomain } = require('../../../../api/utils');

let repositoryNameStep = 1;

function generateUniqueRepository() {
  const res = {
    owner: `repo-owner-${repositoryNameStep}`,
    name: `repo-name-${repositoryNameStep}`,
  };
  repositoryNameStep += 1;
  return res;
}

function makeAttributes(overrides = {}) {
  let { users } = overrides;

  if (users === undefined) {
    users = Promise.all([userFactory()]);
  }

  const repository = generateUniqueRepository();

  return {
    owner: repository.owner,
    repository: repository.name,
    engine: 'jekyll',
    s3ServiceName: 'federalist-dev-s3',
    awsBucketName: 'cg-123456789',
    awsBucketRegion: 'us-gov-west-1',
    defaultBranch: 'main',
    subdomain: generateSubdomain(repository.owner, repository.name),
    users,
    ...overrides,
  };
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
