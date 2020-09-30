const { logger } = require('../../winston');
const { Event } = require('../models');

const createEvent = (obj) => {
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

  return Event.create(atts)
    .catch((err) => {
      logger.warn([`Failed to create Event(${JSON.stringify(atts)}`, err].join('\n'));
    });
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

module.exports = {
  audit,
  error,
};
