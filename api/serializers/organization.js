const BaseSerializer = require('./base');

const attributes = {
  id: '',
  name: '',
  createdAt: 'date',
  updatedAt: 'date',
  isSandbox: '',
};

module.exports = new BaseSerializer(attributes);
