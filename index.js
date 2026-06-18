const { logger } = require('./winston');
const server = require('./api/server');

const { PORT = 1337 } = process.env;

require('./app');

server.listen(PORT, () => {
  logger.info('Server running!');
});
