/* eslint-disable no-console */
const { saveSite } = require('../api/services/ProxyDataSync');
const { Site } = require('../api/models');

Site.findAll({
  attributes: ['id', 'owner', 'repository', 'awsBucketName', 'awsBucketRegion', 's3ServiceName', 'updatedAt', 'config', 'subdomain'],
})
  .then(sites => Promise.all(sites.map(site => saveSite(site))))
  .catch((err) => {
    console.error(err);
    throw err;
  });
