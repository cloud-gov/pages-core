const BaseSerializer = require('./base');

const attributes = {
  id: '',
  name: '',
  createdAt: 'date',
  updatedAt: 'date',
  isSandbox: '',
  sandboxCleanedAt: 'date',
  daysUntilSandboxCleaning: '',
};

module.exports = new BaseSerializer(attributes);
