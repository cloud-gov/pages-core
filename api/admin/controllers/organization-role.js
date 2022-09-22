const organizationRoleSerializer = require('../../serializers/organization-role');
const { Organization, OrganizationRole, Event } = require('../../models');
const { toInt, wrapHandlers } = require('../../utils');
const { fetchModelById } = require('../../utils/queryDatabase');
const EventCreator = require('../../services/EventCreator');

module.exports = wrapHandlers({
  async destroy(req, res) {
    const {
      params: { org_id: orgId, user_id: userId },
    } = req;

    const org = await fetchModelById(orgId, Organization);
    if (!org) return res.notFound();

    await OrganizationRole.destroy({
      where: {
        organizationId: toInt(orgId),
        userId: toInt(userId),
      },
    });
    EventCreator.audit(Event.labels.ADMIN_ACTION, req.user, 'OrganizationRole Removed', { organizationRole: { orgId, userId } });

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
    EventCreator.audit(Event.labels.ADMIN_ACTION, req.user, 'OrganizationRole Updated', { organizationRole: { organizationId, userId, roleId } });
    const member = await OrganizationRole.forOrganization(org)
      .findOne({ where: { userId: toInt(userId) } });

    const json = organizationRoleSerializer.serialize(member);
    return res.json(json);
  },
});
