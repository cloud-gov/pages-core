const Tokens = require('csrf');

const tokens = new Tokens();

const TEST_CSRF_SECRET = 'csrf-secret';

module.exports = {
  TEST_CSRF_SECRET,
  getToken: () => tokens.create(TEST_CSRF_SECRET),
};
