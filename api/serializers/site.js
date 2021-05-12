const yaml = require('js-yaml');
const { omitBy, pick } = require('../utils');
const { Organization, Site, User } = require('../models');
const userSerializer = require('./user');
const { siteViewLink, hideBasicAuthPassword } = require('../utils/site');

const allowedAttributes = [
  'id',
  'demoBranch',
  'demoDomain',
  'defaultBranch',
  'domain',
  'engine',
  'owner',
  'publishedAt',
  'repository',
  's3ServiceName',
  'awsBucketName',
  'Organization',
  'Users',
];

const dateFields = [
  'createdAt',
  'updatedAt',
  'repoLastVerified',
];

const yamlFields = [
  'defaultConfig',
  'demoConfig',
  'previewConfig',
];

const viewLinks = {
  demoViewLink: 'demo',
  previewLink: 'preview',
  viewLink: 'site',
};

// Eventually replace `serialize`
function serializeNew(site, isSystemAdmin = false) {
  const object = site.get({ plain: true });

  const filtered = pick(allowedAttributes, object);

  dateFields
    .filter(dateField => object[dateField])
    .forEach((dateField) => { filtered[dateField] = object[dateField].toISOString(); });

  yamlFields
    .filter(yamlField => object[yamlField])
    .forEach((yamlField) => { filtered[yamlField] = yaml.safeDump(object[yamlField]); });

  Object
    .keys(viewLinks)
    .forEach((key) => { filtered[key] = siteViewLink(object, viewLinks[key]); });

  filtered.basicAuth = hideBasicAuthPassword(site.basicAuth);

  if (isSystemAdmin) {
    filtered.containerConfig = site.containerConfig;
  }

  return omitBy((v => v === null), filtered);
}

const serializeObject = (site, isSystemAdmin) => {
  const json = serializeNew(site, isSystemAdmin);

  if (json.Users) {
    json.users = site.Users.map(u => userSerializer.toJSON(u));
    delete json.Users;
  }

  if (json.Organization) {
    json.organizationId = site.Organization.id;
    delete json.Organization;
  }

  return json;
};

// Eventually replace `serialize` for arrays
function serializeMany(sites, isSystemAdmin) {
  return sites.map(site => serializeObject(site, isSystemAdmin));
}

const serialize = (serializable) => {
  const include = [User.scope('withGithub'), Organization];

  if (serializable.length !== undefined) {
    const siteIds = serializable.map(site => site.id);
    const query = Site.findAll({ where: { id: siteIds }, include });
    return query.then(sites => sites.map(site => serializeObject(site)));
  }

  const query = Site.findByPk(serializable.id, { include });
  return query.then(serializeObject);
};

module.exports = {
  serialize, toJSON: serializeNew, serializeNew, serializeMany,
};
