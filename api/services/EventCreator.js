const { logger } = require('../../winston');
const { Event } = require('../models');

const createEvent = async (obj) => {
  let event;
  try {
    const {
      label, type, model, body,
    } = obj;
    let modelId;
    let modelName;

    if (model) {
      modelId = model.id;
      modelName = model.constructor.name;
    }

    const atts = {
      label,
      type,
      model: modelName,
      modelId,
      body,
    };

    event = await Event.create(atts);
    if (event.type === Event.types.ERROR) {
      logger.error(JSON.stringify(event));
    } else if (event.type === Event.types.WARN) {
      logger.warn(JSON.stringify(event));
    } else {
      logger.info(JSON.stringify(event));
    }
  } catch (err) {
    logger.warn([`Failed to create Event(${JSON.stringify(obj)}`, err.stack].join('\n'));
  }
  return event;
};

const audit = (label, model, message, body = {}) => createEvent({
  type: Event.types.AUDIT,
  label,
  model,
  body: { ...body, message },
});

const error = (label, err, body = {}) => createEvent({
  type: Event.types.ERROR,
  label,
  body: {
    ...{}, error: err.stack, message: err.message, ...body,
  },
});

const warn = (label, message, err, body = {}) => {
  if (err) {
    body.error = err.stack;
    body.message = err.message;
  }
  if (message && message.length) {
    body.message = message;
  }
  return createEvent({
    type: Event.types.WARNING,
    label,
    body,
  });
};

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
