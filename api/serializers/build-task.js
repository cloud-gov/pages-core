const BaseSerializer = require('./base');
const bttSerializer = require('./build-task-type');
const buildSerializer = require('./build');

const attributes = {
  id: '',
  artifact: '',
  status: '',
  message: '',
  count: '',
  createdAt: 'date',
  updatedAt: 'date',
  siteBuildTaskId: '',
  BuildTaskType: btt => btt && bttSerializer.serialize(btt),
  Build: build => build && buildSerializer.serialize(build),
  buildId: ''
};

const adminAttributes = {
  token: '',
  deletedAt: '',
  serviceName: '',
};

module.exports = new BaseSerializer(attributes, adminAttributes);
