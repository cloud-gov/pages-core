const { logger } = require('../../winston');
const { Event } = require('../models');
const { types: eventTypes, labels: eventLabels } = require('../utils/event');

const userLoggedIn = (user) => Event.create({
        type: eventTypes.AUDIT,
        label: eventLabels.AUTHENTICATION,
        model: user.constructor.name,
        modelId: user.id,
        body: {
          action: 'login',
        },
      })
      .catch(logger.warn);

const userLoggedOut = (user) => Event.create({
        type: eventTypes.AUDIT,
        label: eventLabels.AUTHENTICATION,
        model: user.constructor.name,
        modelId: user.id,
        body: {
          action: 'logout',
        },
      })
      .catch(logger.warn);

module.exports = {
  userLoggedIn,
  userLoggedOut,
};
