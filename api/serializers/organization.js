const BaseSerializer = require('./base');

const attributes = {
  id: '',
  name: '',
  createdAt: 'date',
  updatedAt: 'date',
  isSandbox: '',
  sandboxNextCleaningAt: 'date',
  daysUntilSandboxCleaning: '',
};

module.exports = new BaseSerializer(attributes);
