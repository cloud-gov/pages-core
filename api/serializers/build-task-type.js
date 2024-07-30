const BaseSerializer = require('./base');

const attributes = {
  id: '',
  name: '',
  description: '',
  startsWhen: '',
  url: '',
};

const adminAttributes = {
  metadata: '',
  createdAt: 'date',
  updatedAt: 'date',
  runner: '',
};

module.exports = new BaseSerializer(attributes, adminAttributes);
