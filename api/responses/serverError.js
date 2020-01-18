const { logger } = require('../../winston');

module.exports = (error = {}, { res }) => {
  // TODO - remove when refactoring error handling/logging
  logger.error('Sending 500: ', error);

  res.status(500);
  return res.json({
    message: 'An unexpected error occurred',
    status: 500,
  });
};
