const organizationRoleSerializer = require('../serializers/organization-role');
const { Organization, OrganizationRole } = require('../models');
const { toInt, wrapHandlers } = require('../utils');
const { fetchModelById } = require('../utils/queryDatabase');

module.exports = wrapHandlers({
  async findAllForUser(req, res) {
    const { user } = req;

    const organizationRoles = await OrganizationRole.forUser(user).findAll();

    const json = organizationRoleSerializer.serializeMany(organizationRoles);
    return res.json(json);
  },

  async destroy(req, res) {
    const {
      params: { org_id: orgId, user_id: userId },
      user,
    } = req;

    const org = await fetchModelById(orgId, Organization.forManagerRole(user));
    if (!org) return res.notFound();

    await OrganizationRole.destroy({
      where: {
        organizationId: toInt(orgId),
        userId: toInt(userId),
      },
    });

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

    await OrganizationRole.update({ roleId: toInt(roleId) }, {
      where: {
        organizationId: toInt(organizationId),
        userId: toInt(userId),
      },
    });

    const member = await OrganizationRole.forOrganization(org)
      .findOne({ where: { userId: toInt(userId) } });

    const json = organizationRoleSerializer.serialize(member);
    return res.json(json);
  },
});
