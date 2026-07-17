const env = require('./services/environment')();
const { requiredEnvVarsNode } = require('./config/envVarValidator');

const missing = requiredEnvVarsNode.filter((key) => !env[key]);

if (missing.length > 0) {
  // eslint-disable-next-line
  console.error('FATAL: Missing required secrets:', missing.join(', '));
  process.exit(1);
}

const { logger } = require('./winston');
const server = require('./api/server');

const { PORT = 1337 } = process.env;

require('./app');

server.listen(PORT, () => {
  logger.info('Server running!');
});
