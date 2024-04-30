const { logger } = require('./winston');
const server = require('./api/server');
const scheduleJobs = require('./api/jobs');
const socketIO = require('./api/socketIO');

const { PORT = 1337 } = process.env;

require('./app');

scheduleJobs();
socketIO.init(server);

server.listen(PORT, () => {
  logger.info('Server running!');
});
