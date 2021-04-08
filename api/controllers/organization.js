const organizationSerializer = require('../serializers/organization');
const { Organization } = require('../models');
const { wrapHandlers } = require('../utils');

module.exports = wrapHandlers({
  async findAllForUser({ user }, res) {
    const organizations = await Organization.forUser(user).findAll();

    if (!organizations) {
      return res.notFound();
    }

    const siteJSON = organizationSerializer.serializeMany(organizations);
    return res.json(siteJSON);
  },
});
