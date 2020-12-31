// use dynamodb helper to write items to dynamodb
const url = require('url');
const { DynamoDBDocumentHelper } = require('./DynamoDBDocumentHelper');
const config = require('../../config');

const TABLE_NAME = config.app.proxySiteTable;
const SITE_KEY = 'Id';
const getSiteKey = site => site.subdomain;
const getBranchKey = (build) => {
  const { hostname, pathname } = url.parse(build.url);
  return [hostname, pathname].join('');
};

const siteToItem = (site) => {
  const item = {
    Settings: {},
    BucketName: site.awsBucketName,
    BucketRegion: site.awsBucketRegion,
    UpdatedAt: new Date().toISOString(),
    SiteUpdatedAt: site.updatedAt.toISOString(),
  };

  if (site.config.basicAuth) {
    const { username, password } = site.config.basicAuth;
    if (username && password) {
      item.Settings.BasicAuth = {
        Username: username,
        Password: password,
      };
    }
  }

  item[SITE_KEY] = getSiteKey(site);
  return item;
};

const buildToItem = (build, settings) => {
  const item = {
    Settings: settings,
    UpdatedAt: new Date().toISOString(),
  };

  item[SITE_KEY] = getBranchKey(build);
  return item;
};

const removeSite = (site) => {
  const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
  const key = { [SITE_KEY]: getSiteKey(site) };
  return docClient.delete(TABLE_NAME, key);
};

const saveSite = (site) => {
  const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
  const item = siteToItem(site);
  return docClient.put(TABLE_NAME, item);
};

const saveSites = (sites) => {
  const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
  const items = sites.map(site => ({ PutRequest: { Item: siteToItem(site) } }));
  return docClient.batchWrite(TABLE_NAME, items);
};

const saveBuild = (build, settings) => {
  const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
  const item = buildToItem(build, settings);
  return docClient.put(TABLE_NAME, item);
};

module.exports = {
  saveSite, saveSites, removeSite, siteToItem, getSiteKey, saveBuild,
};
