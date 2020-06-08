// use dynamodb helper to write items to dynamodb
const { DynamoDBDocumentHelper } = require('./DynamoDBDocumentHelper');
const config = require('../../config');

const tableName = config.app.proxySiteTable;
const siteKey = 'id';
const getSiteKey = site => site.subdomain;

const removeSite = (site) => {
  const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
  const key = {}
  key[siteKey] = getSiteKey(site);
  return docClient.delete(tableName, key);
};

const saveSite = (site) => {
  const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
  const item = siteToItem(site);
  return docClient.put(tableName, item);
};

const saveSites = (sites) => {
  const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
  const items = sites.map(site => ({ PutRequest: { Item: siteToItem(site) } }));
  return docClient.batchWrite(tableName, items);
};

const siteToItem = (site) => {
  const item = {
    settings: {
      bucket_name: site.awsBucketName,
      bucket_region: site.awsBucketRegion,
    },
  };

  if (site.id % 2) { // test - set for odd ids
    item.settings.basic_auth = {
      user: site.owner.toLowerCase(),
      password: site.repository.toLowerCase(),
    };
  }

  item[siteKey] = getSiteKey(site);
  return item;
};

module.exports = { saveSite, saveSites, removeSite, siteToItem, getSiteKey };
