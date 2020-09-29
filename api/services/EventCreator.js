const { logger } = require('../../winston');
const { Event } = require('../models');

const createEvent = (obj) => {

  const { label, type, model, body } = obj;
  let modelId;// = null;
  let modelName;// = null;

  if(model) {
    modelId = model.id;
    modelName = model.constructor.name;
  }

  return Event.create({
    label,
    type,
    model: modelName,
    modelId,
    body,
  })
    .catch(logger.warn);
}

const audit = (label, model, body) => createEvent({
  type: Event.types.AUDIT,
  label,
  model,
  body,
});

const error = (label, body) => createEvent({
  type: Event.types.ERROR,
  label,
  body
});

module.exports = {
  audit,
  error,
};
