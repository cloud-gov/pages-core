const yaml = require('js-yaml');
const { omitBy, pick } = require('../utils');
const { Organization, Site } = require('../models');
const { siteViewLink, siteViewDomain, hideBasicAuthPassword } = require('../utils/site');
const DomainService = require('../services/Domain');

const allowedAttributes = [
  'id',
  'demoBranch',
  'demoDomain',
  'defaultBranch',
  'domain',
  'engine',
  'liveDomain',
  'owner',
  'publishedAt',
  'repository',
  's3ServiceName',
  'awsBucketName',
  'isActive',
  'organizationId',
  'Domains',
  'FileStorageService',
  'Organization',
  'SiteBranchConfigs',
  'SiteBuildTasks',
  'Users',
];

const allowedDomainAttributes = [
  'id',
  'names',
  'context',
  'origin',
  'path',
  'state',
  'createdAt',
  'updatedAt',
  'siteBranchConfigId',
];

const allowedSBCAttributes = [
  'id',
  'branch',
  's3Key',
  'config',
  'context',
  'createdAt',
  'updatedAt',
];

const dateFields = ['createdAt', 'updatedAt', 'repoLastVerified'];

const yamlFields = ['defaultConfig', 'demoConfig', 'previewConfig'];

const viewLinks = {
  demoViewLink: 'demo',
  previewLink: 'preview',
  viewLink: 'site',
};

function getLiveDomain(branchConfigs, domains) {
  if (!branchConfigs || !domains) {
    return '';
  }

  const config = branchConfigs.find((c) => c.context === 'site');

  if (!config) {
    return '';
  }

  const domain = domains
    .filter((d) => d.state === 'provisioned')
    .find((d) => d.siteBranchConfigId === config.id);

  if (!domain || !domain?.names) {
    return '';
  }

  const domainName = domain.names.split(',')[0];

  return `https://${domainName}`;
}

// Eventually replace `serialize`
function serializeNew(site, isSystemAdmin = false) {
  const object = site.get({
    plain: true,
  });

  const filtered = pick(allowedAttributes, object);

  dateFields
    .filter((dateField) => object[dateField])
    .forEach((dateField) => {
      filtered[dateField] = object[dateField].toISOString();
    });

  yamlFields
    .filter((yamlField) => object[yamlField])
    .forEach((yamlField) => {
      filtered[yamlField] = yaml.dump(object[yamlField]);
    });

  Object.keys(viewLinks).forEach((key) => {
    filtered[key] = siteViewLink(object, viewLinks[key]);
  });

  filtered.siteOrigin = siteViewDomain(site);

  filtered.basicAuth = hideBasicAuthPassword(site.basicAuth);

  if (isSystemAdmin) {
    filtered.containerConfig = site.containerConfig;
  }

  return omitBy((v) => v === null, filtered);
}

const serializeObject = (site, isSystemAdmin) => {
  const json = serializeNew(site, isSystemAdmin);

  const liveDomain = getLiveDomain(json.SiteBranchConfigs, json.Domains);
  json.liveDomain = liveDomain;

  if (json.Domains) {
    json.domains = site.Domains.map((d) =>
      pick(
        allowedDomainAttributes,
        d.get({
          plain: true,
        }),
      ),
    );
    delete json.Domains;
  }

  if (json.SiteBranchConfigs) {
    json.siteBranchConfigs = site.SiteBranchConfigs.map((sbc) =>
      pick(
        allowedSBCAttributes,
        sbc.get({
          plain: true,
        }),
      ),
    );
    delete json.SiteBranchConfigs;
  }

  if (json.Organization) {
    json.organizationId = site.Organization.id;
    delete json.Organization;
  }

  if (json.FileStorageService) {
    json.fileStorageServiceId = site.FileStorageService?.id;
    delete json.FileStorageService;
  }

  if (site.Domains) {
    json.canEditLiveUrl = !DomainService.isSiteUrlManagedByDomain(
      site,
      site.Domains,
      'site',
    );
    json.canEditDemoUrl = !DomainService.isSiteUrlManagedByDomain(
      site,
      site.Domains,
      'demo',
    );
  }

  return json;
};

// Eventually replace `serialize` for arrays
function serializeMany(sites, isSystemAdmin) {
  return sites.map((site) => serializeObject(site, isSystemAdmin));
}

const serialize = (serializable) => {
  const include = [Organization];

  if (serializable.length !== undefined) {
    const siteIds = serializable.map((site) => site.id);
    const query = Site.findAll({
      where: {
        id: siteIds,
      },
      include,
    });
    return query.then((sites) => sites.map((site) => serializeObject(site)));
  }

  const query = Site.findByPk(serializable.id, { include });
  return query.then(serializeObject);
};

module.exports = {
  serialize,
  serializeObject,
  toJSON: serializeNew,
  serializeNew,
  serializeMany,
};
