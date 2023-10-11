const BaseSerializer = require('./base');

const attributes = {
  id: '',
  name: '',
  createdAt: 'date',
  updatedAt: 'date',
  isSandbox: '',
  sandboxNextCleaningAt: 'date',
  daysUntilSandboxCleaning: '',
  isActive: '',
  agency: '',
  isSelfAuthorized: '',
};

module.exports = new BaseSerializer(attributes);
