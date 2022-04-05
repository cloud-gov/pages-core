const _ = require('underscore');
const utils = require('.');

function buildWhereQuery(queryOptions = {}, queryFields = []) {
  const hasAllowed = queryFields.length > 0;
  return hasAllowed ? _.pick(queryOptions, queryFields) : queryOptions;
}

async function fetchModelById(id, Model, opts = {}) {
  const numId = utils.toInt(id);
  return numId ? Model.findByPk(numId, opts) : null;
}

module.exports = {
  buildWhereQuery,
  fetchModelById,
};
