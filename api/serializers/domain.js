const BaseSerializer = require('./base');
const siteSerializer = require('./site');
const sbcSerializer = require('./site-branch-config');

const attributes = {
  id: '',
  context: '',
  names: '',
  state: '',
  SiteBranchConfig: sbc => sbc && sbcSerializer.serialize(sbc),
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
