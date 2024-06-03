const BaseSerializer = require('./base');

const attributes = {
  userName: '',
  email: '',
  origin: '',
};

const adminAttributes = {
  id: '',
  uaaId: '',
  userId: '',
  origin: '',
};

module.exports = new BaseSerializer(attributes, adminAttributes);
