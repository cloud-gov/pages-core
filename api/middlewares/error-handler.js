const EventCreator = require('../services/EventCreator');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  EventCreator.handlerError(req, err);
  if (!res.headersSent) {
    res.error(err);
  }
}

module.exports = errorHandler;
