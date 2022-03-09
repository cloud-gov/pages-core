const pino = require('pino');

/**
 * @typedef {object} Pino
 */

/**
 * @param {string | undefined} nodeEnv - the value of NODE_ENV
 * @returns {Pino} an instance of the Pino logger
 */
function createLogger(nodeEnv) {
  const pinoConfig = nodeEnv === 'development' ? {
    transport: {
      target: 'pino-pretty',
      options: {
        ignore: 'pid,hostname',
        translateTime: true,
      },
    },
  } : {};

  return pino(pinoConfig);
}

module.exports = createLogger;
