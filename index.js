const { logger } = require('./winston');
const config = require('./config');
const server = require('./api/server');
const scheduleJobs = require('./api/jobs');
const Mailer = require('./api/services/mailer');
const socketIO = require('./api/socketIO');

const { PORT = 1337 } = process.env;

require('./app');

scheduleJobs();
Mailer.init();
socketIO.init(server);

server.listen(PORT, () => {
  logger.info('Server running!');
});
