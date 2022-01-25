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
  selfAuthorizedAt: 'date',
  isSelfAuthorized: '',
};

module.exports = new BaseSerializer(attributes);
