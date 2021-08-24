const organizationRoleSerializer = require('../../serializers/organization-role');
const { Organization, OrganizationRole } = require('../../models');
const { toInt, wrapHandlers } = require('../../utils');
const { fetchModelById } = require('../../utils/queryDatabase');

module.exports = wrapHandlers({
  async destroy(req, res) {
    const {
      body: {
        organizationId,
        userId,
      },
    } = req;

    const org = await fetchModelById(organizationId, Organization);
    if (!org) return res.notFound();

    await OrganizationRole.destroy({
      where: {
        organizationId: toInt(organizationId),
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
    } = req;

    const org = await fetchModelById(organizationId, Organization);
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
