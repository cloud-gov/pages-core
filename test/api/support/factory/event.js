const { Event } = require('../../../../api/models');

const build = ({
  type = 'audit',
  label = 'timing',
  ...params
} = {}) => Event.build({
  type, label, ...params,
});

const event = async ({
  ...params
} = {}) => {
  return build({ ...params }).save();
};

module.exports = event;
