const BaseSerializer = require('./base');

const attributes = {
  userName: '',
  email: '',
  origin: '',
};

const adminAttributes = {
  uaaId: '',
  userId: '',
  origin: '',
};

module.exports = new BaseSerializer(attributes, adminAttributes);
