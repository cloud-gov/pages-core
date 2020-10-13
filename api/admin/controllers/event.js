const Joi = require('joi');
const { Op } = require('sequelize');
const { Event } = require('../../models');
const serializer = require('../../serializers/event');
const { toInt, wrapHandlers } = require('../../utils');

const listSchema = Joi.object({
  limit: Joi.number().min(25).max(100).default(25)
    .required(),
  page: Joi.number().min(1).default(1).required(),
  type: Joi.string().valid(...[...Event.types, '']),
  label: Joi.string(),
});

module.exports = wrapHandlers({
  async list(req, res) {
    const {
      limit, page, type, label,
    } = listSchema.attempt(req.query);

    const offset = limit * (page - 1);

    const query = {
      order: ['createdAt', 'DESC'],
      limit,
      offset,
      where: {},
    };

    if (type) {
      query.where.type = type;
    }

    if (label) {
      query.where.label = { [Op.substring]: label };
    }

    const { rows: events, count } = await Event.findAndCountAll(query);

    const totalPages = Math.trunc(count / limit) + (count % limit === 0 ? 0 : 1);

    const json = {
      meta: {
        eventTypes: Event.types,
        eventLabels: Event.labels,
      },
      currentPage: page,
      totalPages,
      totalItems: count,
      data: serializer.serializeMany(events),
    };

    res.json(json);
  },
});
