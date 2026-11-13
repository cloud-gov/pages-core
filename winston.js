const winston = require('winston');
const expressWinston = require('express-winston');

const config = require('./config');

const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(winston.format.simple(), winston.format.colorize()),
  defaultMeta: {
    service: `pages-${config.app.appEnv}`,
  },
  transports: [new winston.transports.Console()],
  silent: config.log.silent,
});

const databaseLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(winston.format.simple(), winston.format.colorize()),
  defaultMeta: {
    service: `pages-${config.app.appEnv}-database`,
  },
  transports: [new winston.transports.Console()],
  silent: config.log.silent,
});

expressWinston.requestWhitelist.push('body');
expressWinston.bodyBlacklist.push('password', 'value');

// These explicit options override the global whitelist above: omit the body entirely.
// Log request paths, not credentials in headers, query parameters, or bodies.
const requestLogging = {
  requestWhitelist: ['method', 'httpVersion', 'url', 'originalUrl'],
  requestFilter: (req, key) => {
    if (key === 'url' || key === 'originalUrl') return req[key]?.split('?')[0];
    if (key === 'method' || key === 'httpVersion') return req[key];
    return undefined;
  },
};

const expressLogger = expressWinston.logger({
  ...requestLogging,
  msg: (req) => `HTTP ${req.method} ${req.originalUrl.split('?')[0]}`,
  format: winston.format.combine(winston.format.simple(), winston.format.colorize()),
  transports: [new winston.transports.Console()],
  skip: () => config.log.silent,
});

const expressErrorLogger = expressWinston.errorLogger({
  ...requestLogging,
  format: winston.format.combine(winston.format.json(), winston.format.colorize()),
  transports: [new winston.transports.Console()],
  skip: () => config.log.silent,
});

module.exports = {
  logger,
  expressLogger,
  expressErrorLogger,
  databaseLogger,
};
