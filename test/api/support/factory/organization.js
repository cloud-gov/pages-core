const { Organization } = require('../../../../api/models');

const counters = {};

function increment(key) {
  counters[key] = (counters[key] || 0) + 1;
  return `${key}-${counters[key]}`;
}

function build(params = {}) {
  let { name } = params;
  if (!name) {
    name = increment('org');
  }

  return Organization.build({...params, name});
}

function create(params) {
  return build(params).save();
}

function truncate() {
  return Organization.truncate({ force: true, cascade: true });
}

module.exports = {
  build,
  create,
  truncate,
};
