const { sequelize, Event } = require('../../models');
const serializer = require('../../serializers/event');
const { paginate, wrapHandlers } = require('../../utils');

module.exports = wrapHandlers({
  async list(req, res) {
    const { limit, page, type, label, model, modelId } = req.query;

    const query = {
      where: {},
    };

    if (type) {
      query.where.type = type;
    }

    if (label) {
      query.where.label = label;
    }

    if (model) {
      query.where.model = model;
    }

    if (modelId) {
      query.where.modelId = modelId;
    }

    const pagination = await paginate(
      Event,
      serializer.serializeMany,
      { limit, page },
      query,
    );

    const json = {
      meta: {
        eventTypes: Object.values(Event.types),
        eventLabels: Object.values(Event.labels),
        models: Object.keys(sequelize.models),
      },
      ...pagination,
    };

    res.json(json);
  },
});
