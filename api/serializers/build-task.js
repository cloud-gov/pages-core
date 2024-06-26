const BaseSerializer = require('./base');
const bttSerializer = require('./build-task-type');

function miniBuildSerializer({ branch, requestedCommitSha }) {
  return {branch, requestedCommitSha }
}
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
  Build: build => build && miniBuildSerializer(build.toJSON()),
  buildId: ''
};

const adminAttributes = {
  token: '',
  deletedAt: '',
  serviceName: '',
};

module.exports = new BaseSerializer(attributes, adminAttributes);
