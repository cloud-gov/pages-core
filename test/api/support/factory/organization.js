const { Organization } = require('../../../../api/models');

const counters = {};

function increment(key) {
  counters[key] = (counters[key] || 0) + 1;
  return `${key}-${counters[key]}`;
}

function build({ name } = {}) {
  const params = {
    name: name || increment('org'),
  };

  return Organization.build(params);
}

function create(params) {
  return build(params).save();
}

module.exports = {
  build,
  create,
};