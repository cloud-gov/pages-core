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

const audit = (label, model, body) => createEvent({
  type: Event.types.AUDIT,
  label,
  model,
  body,
});

const error = (label, body) => createEvent({
  type: Event.types.ERROR,
  label,
  body,
});

const warn = (label, body) => createEvent({
  type: Event.types.WARNING,
  label,
  body,
});

module.exports = {
  audit,
  error,
  warn,
};
