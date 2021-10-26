const { Domain } = require('../../../../api/models');
const siteFactory = require('./site');

const counters = {};

function increment(key, reverse = false) {
  counters[key] = (counters[key] || 0) + 1;
  const parts = [key, counters[key]];

  if (reverse) {
    parts.reverse();
  }

  return parts.join('-');
}

function build(params = {}) {
  const {
    branch = increment('branch'),
    names = increment('www.example.gov', true),
  } = params;

  return Domain.build({ ...params, branch, names });
}

async function create(params = {}) {
  return build({
    ...params,
    siteId: params.siteId || (await siteFactory()).id,
  }).save();
}

function truncate() {
  return Domain.truncate({ force: true, cascade: true });
}

module.exports = {
  build,
  create,
  truncate,
};
