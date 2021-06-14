const organizationRoleSerializer = require('../serializers/organization-role');
const { Organization, OrganizationRole } = require('../models');
const { wrapHandlers } = require('../utils');
const { fetchModelById } = require('../utils/queryDatabase');

module.exports = wrapHandlers({
  async findAllForUser(req, res) {
    const { user } = req;

    const organizationRoles = await OrganizationRole.forUser(user).findAll();

    if (!organizationRoles) {
      return res.notFound();
    }

    const json = organizationRoleSerializer.serializeMany(organizationRoles);
    return res.json(json);
  },

  async destroy(req, res) {
    const {
      body: {
        organizationId,
        userId,
      },
      user,
    } = req;

    const org = await fetchModelById(organizationId, Organization.forManagerRole(user));
    if (!org) return res.notFound();

    await OrganizationRole.destroy({ where: { organizationId, userId } });

    return res.json({});
  },

  async update(req, res) {
    const {
      body: {
        organizationId,
        roleId,
        userId,
      },
      user,
    } = req;

    const org = await fetchModelById(organizationId, Organization.forManagerRole(user));
    if (!org) return res.notFound();

    const member = await OrganizationRole.forOrganization(org).findOne({ where: { userId } });
    await member.update({ roleId });

    const json = organizationRoleSerializer.serialize(member);
    return res.json(json);
  },
});
