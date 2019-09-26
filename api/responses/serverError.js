const { logger } = require('../../winston');

module.exports = (error = {}, { res }) => {
  logger.error('Sending 500: %o', error);

  res.status(500);
  return res.json({
    message: 'Internal server error',
    status: 500,
  });
};
