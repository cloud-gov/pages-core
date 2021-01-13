const { logger } = require('../../winston');
const { Event } = require('../models');

const createEvent = (obj) => Event
  .create(obj)
  .catch((err) => {
    logger.error([`Failed to create Event(${JSON.stringify(obj)}`, err.stack].join('\n'));
  });

const audit = (label, model, message, body = {}) => createEvent({
  type: Event.types.AUDIT,
  label,
  model: model.constructor.name,
  modelId: model.id,
  body: {
    message,
    ...body,
  },
});

const error = (label, err, body = {}) => createEvent({
  type: Event.types.ERROR,
  label,
  body: {
    error: err.stack,
    message: err.message,
    ...body,
  },
});

const warn = (label, err, body = {}) => createEvent({
  type: Event.types.WARNING,
  label,
  body: {
    error: err.stack,
    message: err.message,
    ...body,
  },
});

const handlerError = async (request, err) => {
  const { path, params, body } = request;
  const errBody = { request: { path, params, body } };
  // remove secrets
  delete errBody.body.password; // basicAuth password
  delete errBody.body.value; // uev value
  return error(Event.labels.REQUEST_HANDLER, err, errBody);
};

module.exports = {
  audit,
  error,
  warn,
  handlerError,
};
