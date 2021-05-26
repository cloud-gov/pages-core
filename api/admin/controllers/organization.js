const { serialize, serializeMany } = require('../../serializers/organization');
const { paginate, wrapHandlers } = require('../../utils');
const { Organization } = require('../../models');
const OrganizationService = require('../../services/organization');
const { fetchModelById } = require('../../utils/queryDatabase');

module.exports = wrapHandlers({
  async list(req, res) {
    const { limit, page, search } = req.query;

    const scopes = [];

    if (search) {
      scopes.push(Organization.searchScope(search));
    }

    const pagination = await paginate(Organization.scope(scopes), serializeMany, { limit, page });

    const json = {
      meta: {},
      ...pagination,
    };

    return res.json(json);
  },

  async findById(req, res) {
    const {
      params: { id },
    } = req;

    const org = await fetchModelById(id, Organization);
    if (!org) return res.notFound();

    return res.json(serialize(org));
  },

  async create(req, res) {
    const {
      body: { managerGithubUsername, managerUAAEmail, name },
      user,
    } = req;

    const [org, uaaUserAttributes] = await OrganizationService.createOrganization(
      user, name, managerUAAEmail, managerGithubUsername
    );

    const json = {
      invite: { email: uaaUserAttributes.email, link: uaaUserAttributes.inviteLink },
      org: serialize(org),
    };

    return res.json(json);
  },

  async update(req, res) {
    const {
      body: { name },
      params: { id },
    } = req;

    const org = await fetchModelById(id, Organization);
    if (!org) return res.notFound();

    await org.update({ name });

    return res.json(serialize(org));
  },
});
