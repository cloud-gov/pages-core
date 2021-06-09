const organizationSerializer = require('../serializers/organization');
const { Organization } = require('../models');
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

  async update(req, res) {
    const {
      body: { name },
      params: { id },
      user,
    } = req;

    const org = await fetchModelById(id, Organization.forManagerRole(user));
    if (!org) return res.notFound();

    await org.update({ name });

    return res.json(organizationSerializer.serialize(org));
  },

  async invite(req, res) {
    const {
      body: { roleId, uaaEmail, githubUsername },
      params: { id },
      user,
    } = req;

    const { email, inviteLink: link } = await OrganizationService.inviteUserToOrganization(
      user, toInt(id), toInt(roleId), uaaEmail, githubUsername
    );

    const json = {
      invite: { email, link },
    };

    return res.json(json);
  },
});
