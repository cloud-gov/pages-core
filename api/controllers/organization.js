const organizationSerializer = require('../serializers/organization');
const { User, Organization } = require('../models');
const { wrapHandlers } = require('../utils');
const { fetchModelById } = require('../utils/queryDatabase');

module.exports = wrapHandlers({
  async findAllForUser(req, res) {
    const user = await fetchModelById(req.user.id, User, { include: [Organization] });

    if (!user) {
      return res.notFound();
    }

    const siteJSON = await organizationSerializer.serializeMany(user.Organizations);
    return res.json(siteJSON);
  },
});
