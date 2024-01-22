const json2csv = require('@json2csv/plainjs');
const {
  Organization,
  Site,
  User,
  Event,
} = require('../../models');
const { paginate, toInt, wrapHandlers } = require('../../utils');
const { fetchModelById } = require('../../utils/queryDatabase');
const userSerializer = require('../../serializers/user');
const Mailer = require('../../services/mailer');
const EventCreator = require('../../services/EventCreator');
const OrganizationService = require('../../services/organization');

async function listForUsersReportHelper(req, res, scopes) {
  const { limit, page } = req.query;

  const serialize = users => userSerializer.serializeMany(users, true);

  const pagination = await paginate(User.scope(scopes), serialize, {
    limit,
    page,
  });

  const json = {
    meta: {},
    ...pagination,
  };

  return res.json(json);
}

async function listForUsersReportCSVHelper(req, res, scopes) {
  const users = await User.scope(scopes).findAll();

  const fields = [
    {
      label: 'ID',
      value: 'id',
    },
    {
      label: 'Email',
      value: 'UAAIdentity.email',
    },
    {
      label: 'Organizations',
      value: user => user.OrganizationRoles.map(orgRole => `${orgRole.Organization.name}`)
        .join('|'),
    },
    {
      label: 'Details',
      value: user => user.OrganizationRoles.map(
        orgRole => `${orgRole.Organization.name}: ${orgRole.Role.name}`)
        .join(', '),
    },
    {
      label: 'Created',
      value: 'createdAt',
    },
    {
      label: 'Last Signed In',
      value: 'signedInAt',
    },
  ];

  const parser = new json2csv.Parser({ fields });
  const csv = parser.parse(users);
  res.attachment('users.csv');
  return res.send(csv);
}

module.exports = wrapHandlers({
  async me(req, res) {
    res.json({
      ...userSerializer.toJSON(req.user),
      csrfToken: req.csrfToken(),
    });
  },

  async list(req, res) {
    const {
      limit, page, organization, search, site,
    } = req.query;

    const serialize = users => userSerializer.serializeMany(users, true);

    const scopes = ['withUAAIdentity'];

    if (search) {
      scopes.push(User.searchScope(search));
    }

    if (site) {
      scopes.push(User.siteScope(site));
    }

    if (organization) {
      scopes.push(User.orgScope(organization));
      scopes.push('withOrganizationRoles');
    }

    const [pagination, orgs, sites] = await Promise.all([
      paginate(User.scope(scopes), serialize, { limit, page }),
      Organization.findAll({ attributes: ['id', 'name'], raw: true }),
      Site.findAll({ attributes: ['id', 'owner', 'repository'], raw: true }),
    ]);

    const json = {
      meta: { orgs, sites },
      ...pagination,
    };

    return res.json(json);
  },

  async listForUsersReport(req, res) {
    const scopes = ['withUAAIdentity', 'withOrganizationRoles'];
    return listForUsersReportHelper(req, res, scopes);
  },

  async listForUsersReportCSV(req, res) {
    const scopes = ['withUAAIdentity', 'withOrganizationRoles'];
    return listForUsersReportCSVHelper(req, res, scopes);
  },

  async listForActiveUsersReport(req, res) {
    const scopes = ['havingUAAIdentity', 'withOrganizationRoles'];
    return listForUsersReportHelper(req, res, scopes);
  },

  async listForActiveUsersReportCSV(req, res) {
    const scopes = ['havingUAAIdentity', 'withOrganizationRoles'];
    return listForUsersReportCSVHelper(req, res, scopes);
  },

  async findById(req, res) {
    const {
      params: { id },
    } = req;

    const user = await fetchModelById(
      id,
      User.scope(['withUAAIdentity', 'withOrganizationRoles'])
    );
    if (!user) {
      return res.notFound();
    }

    const userJSON = userSerializer.toJSON(user, true);

    return res.json(userJSON);
  },

  async invite(req, res) {
    const {
      body: { uaaEmail, organizationId, roleId },
      user,
    } = req;

    const { email, inviteLink: link } = await OrganizationService.inviteUserToOrganization(
      user,
      toInt(organizationId),
      toInt(roleId),
      uaaEmail
    );
    EventCreator.audit(Event.labels.ADMIN_ACTION, req.user, 'User Invited', {
      organizationId,
      roleId,
      email,
      link,
    });
    if (link) {
      await Mailer.sendUAAInvite(email, link);
      EventCreator.audit(
        Event.labels.ADMIN_ACTION,
        req.user,
        'User Invite Sent',
        { user: { email }, link }
      );
    }

    const json = {
      invite: { email, link },
    };

    return res.json(json);
  },

  async resendInvite(req, res) {
    const {
      body: { uaaEmail },
      user,
    } = req;

    const { email, inviteLink: link } = await OrganizationService.resendInvite(
      user,
      uaaEmail
    );
    EventCreator.audit(
      Event.labels.ADMIN_ACTION,
      req.user,
      'User Invite Resent',
      { user: { email }, link }
    );
    if (link) {
      await Mailer.sendUAAInvite(email, link);
    }

    const json = {
      invite: { email, link },
    };

    return res.json(json);
  },
});
