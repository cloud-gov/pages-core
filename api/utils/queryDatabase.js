const _ = require('underscore');

function buildWhereQuery(queryOptions = {}, queryFields = []) {
  const hasAllowed = queryFields.length > 0;
  const options = hasAllowed ? _.pick(queryOptions, queryFields) : queryOptions;
  return options;
}

module.exports = {
  buildWhereQuery
};
