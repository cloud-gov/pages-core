const { setTimeout } = require('timers');

const collect = require('./collect');
const createLogger = require('./logger');
const send = require('./send');

const logger = createLogger(process.env.NODE_ENV);

/**
 * @param {number} intervalInSeconds - the interval between metric collections in seconds
 * @param {number} timestamp  - the current timestamp in milliseconds assigned to the metrics
 */
async function collectAndSend(intervalInSeconds, timestamp) {
  try {
    logger.info('Collecting metrics from cloud.gov');

    const metrics = await collect(timestamp);

    logger.info(`Collected ${metrics.length} metrics from cloud.gov`);

    logger.info('Sending metrics to New Relic');

    await send(metrics);

    logger.info('Metrics sent to New Relic');

    logger.info(`Waiting for ${intervalInSeconds} seconds.`);

    // eslint-disable-next-line scanjs-rules/call_setTimeout
    setTimeout(() => collectAndSend(intervalInSeconds, Date.now()), intervalInSeconds * 1000);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

async function start() {
  const { INTERVAL_IN_S } = process.env;

  logger.info(`Metrics starting up with interval: ${INTERVAL_IN_S} seconds.`);

  collectAndSend(INTERVAL_IN_S, Date.now());
}

start();
