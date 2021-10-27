const { Domain } = require('../../../../api/models');
const siteFactory = require('./site');

const counters = {};

function increment(key) {
  counters[key] = (counters[key] || 0) + 1;
  return `${counters[key]}-${key}`;
}

function build(params = {}) {
  const {
    context = 'site',
    names = increment('www.example.gov'),
  } = params;

  return Domain.build({
    ...params, context, names,
  });
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
