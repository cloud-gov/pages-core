const { Event } = require('../../models');
const serializer = require('../../serializers/event');
const { paginate, wrapHandlers } = require('../../utils');

module.exports = wrapHandlers({
  async list(req, res) {
    const {
      limit, page, type, label,
    } = req.query;

    const query = { where: {} };

    if (type) {
      query.where.type = type;
    }

    if (label) {
      query.where.label = label;
    }

    const pagination = await paginate(Event, serializer.serializeMany, { limit, page }, query);

    const json = {
      meta: {
        eventTypes: Object.values(Event.types),
        eventLabels: Object.values(Event.labels),
      },
      ...pagination,
    };

    res.json(json);
  },
});
