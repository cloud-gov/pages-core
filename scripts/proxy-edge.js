const { saveSites } = require('../api/services/ProxyDataSync');
const { Site } = require('../api/models');

Site.findAll({
  attributes: ['id', 'owner', 'repository', 'awsBucketName', 'awsBucketRegion', 's3ServiceName', 'updatedAt', 'config', 'subdomain'],
})
  .then(saveSites);
