const _ = require('underscore');
const utils = require('.');

function buildWhereQuery(queryOptions = {}, queryFields = []) {
  const hasAllowed = queryFields.length > 0;
  const options = hasAllowed ? _.pick(queryOptions, queryFields) : queryOptions;
  return options;
}

async function fetchModelById(id, Model) {
  const numId = utils.toInt(id);
  return numId ? Model.findByPk(numId) : null;
}

module.exports = {
  buildWhereQuery,
  fetchModelById,
};
