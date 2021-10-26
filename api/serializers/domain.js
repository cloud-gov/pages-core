const BaseSerializer = require('./base');
const siteSerializer = require('./site');

const attributes = {
  id: '',
  branch: '',
  names: '',
  state: '',
  Site: (site, _, isSystemAdmin) => site && siteSerializer.serializeNew(site, isSystemAdmin),
  createdAt: 'date',
  updatedAt: 'date',
};

const adminAttributes = {
  origin: '',
  path: '',
  serviceName: '',
};

module.exports = new BaseSerializer(attributes, adminAttributes);
