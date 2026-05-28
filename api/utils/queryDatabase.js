const utils2 = require('../utils');
const utils = require('.');

function buildWhereQuery(queryOptions = {}, queryFields = []) {
  const hasAllowed = queryFields.length > 0;
  return hasAllowed ? utils2.pick(queryFields, queryOptions) : queryOptions;
}

async function fetchModelById(id, Model, opts = {}) {
  const numId = utils.toInt(id);
  return numId ? Model.findByPk(numId, opts) : null;
}

module.exports = {
  buildWhereQuery,
  fetchModelById,
};
