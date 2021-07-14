const { logger } = require('./winston');
const config = require('./config');
const server = require('./api/server');
const scheduleJobs = require('./api/jobs');
const Mailer = require('./api/services/mailer');

const { PORT = 1337 } = process.env;

const { env: { newRelicAppName, newRelicLicenseKey } } = config;

// If settings present, start New Relic
if (newRelicAppName && newRelicLicenseKey) {
  logger.info(`Activating New Relic: ${newRelicAppName}`);
  require('newrelic'); // eslint-disable-line global-require
} else {
  logger.warn('Skipping New Relic Activation');
}

require('./app');

scheduleJobs();
Mailer.init();

server.listen(PORT, () => {
  logger.info('Server running!');
});
