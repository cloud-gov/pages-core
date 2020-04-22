const winston = require('winston');
const expressWinston = require('express-winston');

const config = require('./config');

const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(
    winston.format.simple(),
    winston.format.colorize()
  ),
  defaultMeta: { service: `federalistapp-${config.app.app_env}` },
  transports: [new winston.transports.Console()],
  silent: config.log.silent,
});

const databaseLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.simple(),
    winston.format.colorize()
  ),
  defaultMeta: { service: `federalistapp-${config.app.app_env}-database` },
  transports: [new winston.transports.Console()],
  silent: config.log.silent,
});

const expressLogger = expressWinston.logger({
  format: winston.format.combine(
    winston.format.simple(),
    winston.format.colorize()
  ),
  transports: [new winston.transports.Console()],
  requestWhitelist: expressWinston.requestWhitelist.concat('body'),
  skip: () => config.log.silent,
});

const expressErrorLogger = expressWinston.errorLogger({
  format: winston.format.combine(
    winston.format.json(),
    winston.format.colorize()
  ),
  transports: [new winston.transports.Console()],
  skip: () => config.log.silent,
});

module.exports = {
  logger, expressLogger, expressErrorLogger, databaseLogger,
};
