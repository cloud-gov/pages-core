const BaseSerializer = require('./base');

const attributes = {
  id: '',
  name: '',
  createdAt: 'date',
  updatedAt: 'date',
};

module.exports = new BaseSerializer(attributes);
