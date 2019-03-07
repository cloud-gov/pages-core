const winston = require('winston');
const expressWinston = require('express-winston');

const config = require('./config');

const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.colorize(),
  defaultMeta: { service: `federalistapp-${config.app.app_env}` },
  transports: [
    new winston.transports.Console({
      format: winston.format.colorize(),
    }),
  ]
});

const expressLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      format: winston.format.colorize(),
    }),
  ],
  requestWhitelist: expressWinston.requestWhitelist.concat('body'),
});

const expressErrorLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      format: winston.format.colorize(),
      format: winston.format.json(),
    }),
  ],
  requestWhitelist: expressWinston.requestWhitelist.concat('body'),
});

module.exports = { logger, expressLogger, expressErrorLogger };
