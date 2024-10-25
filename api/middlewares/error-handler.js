const EventCreator = require('../services/EventCreator');

function errorHandler(err, req, res, _next) {
  EventCreator.handlerError(req, err);
  if (!res.headersSent) {
    res.error(err);
  }
}

module.exports = errorHandler;
