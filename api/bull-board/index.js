const http = require('http');
const app = require('./app');
const { logger } = require('../../winston');

const { PORT = 1338 } = process.env;

async function run() {
  http.createServer(app).listen(PORT, () => {
    logger.info(`Server for Bull Board running on PORT ${PORT}!`);
  });
}

run().catch(e => logger.error(e));
