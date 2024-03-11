const organizationSerializer = require('../serializers/organization');
const organizationRoleSerializer = require('../serializers/organization-role');
const {
  Event, Organization, OrganizationRole, User,
} = require('../models');
const EventCreator = require('../services/EventCreator');
const Mailer = require('../services/mailer');
const OrganizationService = require('../services/organization');
const { toInt, wrapHandlers } = require('../utils');
const { fetchModelById } = require('../utils/queryDatabase');

module.exports = wrapHandlers({
  async findAllForUser({ user }, res) {
    const organizations = await Organization.forUser(user).findAll();

    if (!organizations) {
      return res.notFound();
    }

    const json = organizationSerializer.serializeMany(organizations);
    return res.json(json);
  },

  async findOneForUser(req, res) {
    const {
      params: { id },
      user,
    } = req;

    const org = await fetchModelById(id, Organization.forManagerRole(user));
    if (!org) {
      return res.notFound();
    }

    const json = organizationSerializer.serialize(org);
    return res.json(json);
  },

  async invite(req, res) {
    const {
      body: { roleId, uaaEmail },
      params: { id },
      user,
    } = req;

    const org = await fetchModelById(toInt(id), Organization.forManagerRole(user));
    if (!org) {
      return res.notFound();
    }

    const { email, inviteLink: link, origin } = await OrganizationService.inviteUserToOrganization(
      user, org.id, toInt(roleId), uaaEmail
    );

    // TODO - refactor above method to return user so this extra query is not necessary
    const newUser = await User.byUAAEmail(email).findOne();
    const member = await OrganizationRole.forOrganization({ id: toInt(id) })
      .findOne({ where: { userId: newUser.id } });

    if (link) {
      await Mailer.sendUAAInvite(email, link, origin, org.name);
    }

    const json = {
      member: organizationRoleSerializer.serialize(member),
      invite: { email, link },
    };

    EventCreator.audit(Event.labels.ORG_MANAGER_ACTION, req.user, 'User Invited by Org Manager', {
      organizationId: org.id,
      roleId,
      email,
      link,
    });

    return res.json(json);
  },

  async members(req, res) {
    const {
      params: { id },
      user,
    } = req;

    const org = await fetchModelById(id, Organization.forManagerRole(user));

    if (!org) {
      return res.notFound();
    }

    const members = await OrganizationRole.forOrganization(org).findAll();

    const json = organizationRoleSerializer.serializeMany(members);
    return res.json(json);
  },
});
