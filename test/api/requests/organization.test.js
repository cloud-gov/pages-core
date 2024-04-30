const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');

const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const csrfToken = require('../support/csrfToken');
const {
  Organization, OrganizationRole, Role, User,
} = require('../../../api/models');
const OrganizationService = require('../../../api/services/organization');
const QueueJobs = require('../../../api/queue-jobs');

const { requiresAuthentication } = require('./shared');

function organizationResponseExpectations(response, org) {
  expect(response.id).to.equal(org.id);
  expect(response.name).to.equal(org.name);
}

function clean() {
  return Promise.all([
    Organization.truncate({ force: true, cascade: true }),
    OrganizationRole.truncate({ force: true, cascade: true }),
    User.truncate({ force: true, cascade: true }),
  ]);
}

describe('Organization API', () => {
  let authenticatedRequest;
  let currentUser;
  let userRole;
  let managerRole;

  before(async () => {
    await clean();
    [userRole, managerRole] = await Promise.all([
      Role.findOne({ where: { name: 'user' } }),
      Role.findOne({ where: { name: 'manager' } }),
    ]);
  });

  beforeEach(async () => {
    currentUser = await factory.user();
    const cookie = await authenticatedSession(currentUser);
    authenticatedRequest = request.agent(app).set('Cookie', cookie);
  });

  afterEach(clean);

  describe('GET /v0/organization', () => {
    requiresAuthentication('GET', '/organization');

    it('should render a list of organizations associated with the user', async () => {
      const [org1, org2] = await Promise.all([
        factory.organization.create(),
        factory.organization.create(),
        factory.organization.create(),
      ]);

      await Promise.all([
        currentUser.addOrganization(org1, { through: { roleId: userRole.id } }),
        currentUser.addOrganization(org2, { through: { roleId: managerRole.id } }),
      ]);

      const response = await authenticatedRequest.get('/v0/organization');

      validateAgainstJSONSchema('GET', '/organization', 200, response.body);
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.be.a('array');
      expect(response.body).to.have.length(2);

      const foundOrganizations = await Promise.all(
        response.body.map(org => Organization.findByPk(org.id, { include: [User] }))
      );

      return foundOrganizations.forEach((org) => {
        const responseOrg = response.body.find(candidate => candidate.id === org.id);
        expect(responseOrg).not.to.be.undefined;
        organizationResponseExpectations(responseOrg, org);
      });
    });

    it('should not render any organizations not associated with the user', async () => {
      const organizationPromises = Array(3).fill(0).map(() => factory.organization.create());
      const organizations = await Promise.all(organizationPromises);

      expect(organizations).to.have.length(3);

      const response = await authenticatedRequest.get('/v0/organization');

      expect(response.statusCode).to.equal(200);

      validateAgainstJSONSchema('GET', '/organization', 200, response.body);
      expect(response.body).to.be.a('array');
      expect(response.body).to.be.empty;
    });
  });

  describe('GET /v0/organization/:id', () => {
    requiresAuthentication('GET', '/organization/1', '/organization/{id}');

    it('returns a 404 if the user is not a manager of the organization', async () => {
      const org = await factory.organization.create();
      await currentUser.addOrganization(org, { through: { roleId: userRole.id } });

      const response = await authenticatedRequest.get(`/v0/organization/${org.id}`);
      validateAgainstJSONSchema('GET', '/organization/{id}', 404, response.body);
      expect(response.statusCode).to.equal(404);
    });

    it('returns the organization', async () => {
      const org = await factory.organization.create();
      await currentUser.addOrganization(org, { through: { roleId: managerRole.id } });

      const response = await authenticatedRequest.get(`/v0/organization/${org.id}`);

      validateAgainstJSONSchema('GET', '/organization/{id}', 200, response.body);
      expect(response.body.id).to.eq(org.id);
    });

    it('returns a 404 if the user is a manager of an inactive organization', async () => {
      const org = await factory.organization.create({ isActive: false });
      await currentUser.addOrganization(org, { through: { roleId: managerRole.id } });

      const response = await authenticatedRequest.get(`/v0/organization/${org.id}`);

      validateAgainstJSONSchema('GET', '/organization/{id}', 404, response.body);
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('POST /v0/organization/:id/invite', () => {
    requiresAuthentication('POST', '/organization/1/invite', '/organization/{id}/invite');

    afterEach(sinon.restore);

    it('returns a 400 error if the user is not a manager of the organization', async () => {
      const uaaEmail = 'foo@bar.com';
      const roleId = userRole.id;
      const org = await factory.organization.create();
      await Promise.all([
        currentUser.addOrganization(org, { through: { roleId: userRole.id } }),
        factory.uaaIdentity({ userId: currentUser.id }),
      ]);

      const response = await authenticatedRequest
        .post(`/v0/organization/${org.id}/invite`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({ roleId, uaaEmail });

      validateAgainstJSONSchema('POST', '/organization/{id}/invite', 400, response.body);
    });

    it('returns the member and the invitation details for cloud.gov origin upon invitation', async () => {
      const uaaEmail = 'foo@bar.com';
      const roleId = userRole.id;
      const origin = 'cloud.gov';

      const [targetUser, org] = await Promise.all([
        factory.user(),
        factory.organization.create(),
      ]);

      await Promise.all([
        currentUser.addOrganization(org, { through: { roleId: managerRole.id } }),
        targetUser.addOrganization(org, { through: { roleId } }),
        factory.uaaIdentity({ userId: currentUser.id }),
        factory.uaaIdentity({ userId: targetUser.id, email: uaaEmail }),
      ]);

      const inviteLink = 'https://example.com';

      sinon.stub(OrganizationService, 'inviteUserToOrganization')
        .resolves({
        email: uaaEmail,
        inviteLink,
        origin,
      });

      sinon.stub(QueueJobs.prototype, 'sendUAAInvite').resolves();

      const response = await authenticatedRequest
        .post(`/v0/organization/${org.id}/invite`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({ roleId, uaaEmail });

      validateAgainstJSONSchema('POST', '/organization/{id}/invite', 200, response.body);
      const { member, invite } = response.body;
      expect(invite.email).to.eq(uaaEmail);
      expect(member.Role.id).to.eq(roleId);
      expect(member.User.id).to.eq(targetUser.id);
      sinon.assert.calledOnceWithExactly(
        QueueJobs.prototype.sendUAAInvite,
        uaaEmail,
        inviteLink,
        origin,
        org.name
      );
    });

    it('returns the member and the invitation details for cloud.gov origin upon resent invitation', async () => {
      const uaaEmail = 'foo@bar.com';
      const roleId = userRole.id;
      const origin = 'cloud.gov'
      const isResend = true;

      const [targetUser, org] = await Promise.all([
        factory.user(),
        factory.organization.create(),
      ]);

      await Promise.all([
        currentUser.addOrganization(org, { through: { roleId: managerRole.id } }),
        targetUser.addOrganization(org, { through: { roleId } }),
        factory.uaaIdentity({ userId: currentUser.id }),
        factory.uaaIdentity({ userId: targetUser.id, email: uaaEmail }),
      ]);

      const inviteLink = 'https://example.com';

      sinon.stub(OrganizationService, 'resendInvite')
        .resolves({
        email: uaaEmail,
        inviteLink,
        origin,
      });

      sinon.stub(QueueJobs.prototype, 'sendUAAInvite').resolves();

      const response = await authenticatedRequest
        .post(`/v0/organization/${org.id}/invite`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({ roleId, uaaEmail, isResend });

      validateAgainstJSONSchema('POST', '/organization/{id}/invite', 200, response.body);
      const { invite } = response.body;
      expect(invite.email).to.eq(uaaEmail);
      sinon.assert.calledOnceWithExactly(
        QueueJobs.prototype.sendUAAInvite,
        uaaEmail,
        inviteLink,
        origin,
        org.name
      );
    });


    it('returns a 400 error if the user is a manager of an inactive organization', async () => {
      const uaaEmail = 'foo@bar.com';
      const roleId = userRole.id;

      const [targetUser, org] = await Promise.all([
        factory.user(),
        factory.organization.create({ isActive: false }),
      ]);

      await Promise.all([
        currentUser.addOrganization(org, { through: { roleId: managerRole.id } }),
        targetUser.addOrganization(org, { through: { roleId } }),
        factory.uaaIdentity({ userId: currentUser.id }),
        factory.uaaIdentity({ userId: targetUser.id, email: uaaEmail }),
      ]);

      const inviteLink = 'https://example.com';

      sinon.stub(OrganizationService, 'inviteUserToOrganization')
        .resolves({
        email: uaaEmail,
        inviteLink,
      });

      sinon.stub(QueueJobs.prototype, 'sendUAAInvite').resolves();

      const response = await authenticatedRequest
        .post(`/v0/organization/${org.id}/invite`)
        .set('x-csrf-token', csrfToken.getToken())
        .send({ roleId, uaaEmail });

      validateAgainstJSONSchema('POST', '/organization/{id}/invite', 400, response.body);
    });
  });

  describe('GET /v0/organization/:id/members', () => {
    requiresAuthentication('GET', '/organization/1/members', '/organization/{id}/members');

    it('returns a 404 if the user is not a manager of the organization', async () => {
      const org = await factory.organization.create();
      await currentUser.addOrganization(org, { through: { roleId: userRole.id } });

      const response = await authenticatedRequest.get(`/v0/organization/${org.id}/members`);

      validateAgainstJSONSchema('GET', '/organization/{id}/members', 404, response.body);
    });

    it('returns the organization roles for the organization', async () => {
      const [user, org] = await Promise.all([
        factory.user(),
        factory.organization.create(),
      ]);

      await Promise.all([
        currentUser.addOrganization(org, { through: { roleId: managerRole.id } }),
        user.addOrganization(org, { through: { roleId: userRole.id } }),
      ]);

      const response = await authenticatedRequest.get(`/v0/organization/${org.id}/members`);

      validateAgainstJSONSchema('GET', '/organization/{id}/members', 200, response.body);
      const orgRoles = response.body;
      expect(orgRoles.map(or => or.User.id)).to.have.members([currentUser.id, user.id]);
    });

    it('returns a 404 if the user is a manager of an inactive organization', async () => {
      const [user, org] = await Promise.all([
        factory.user(),
        factory.organization.create({ isActive: false }),
      ]);

      await Promise.all([
        currentUser.addOrganization(org, { through: { roleId: managerRole.id } }),
        user.addOrganization(org, { through: { roleId: userRole.id } }),
      ]);

      const response = await authenticatedRequest.get(`/v0/organization/${org.id}/members`);

      validateAgainstJSONSchema('GET', '/organization/{id}/members', 404, response.body);
    });
  });
});
