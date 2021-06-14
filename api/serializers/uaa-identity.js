const base = require('./base');

const attributes = {
  userName: '',
  email: '',
};

const adminAttributes = {
  uaaId: '',
  userId: '',
  origin: '',
};

module.exports = base(attributes, adminAttributes);
