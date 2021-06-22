const BaseSerializer = require('./base');

const attributes = {
  userName: '',
  email: '',
};

const adminAttributes = {
  uaaId: '',
  userId: '',
  origin: '',
};

module.exports = new BaseSerializer(attributes, adminAttributes);
