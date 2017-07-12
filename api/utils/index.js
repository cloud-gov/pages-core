const moment = require('moment');

const config = require('../../config');

function isPastAuthThreshold(authDate) {
  return moment().isAfter(
    moment(authDate).add(config.policies.authRevalidationMinutes, 'minutes')
  );
}

module.exports = {
  isPastAuthThreshold,
};
