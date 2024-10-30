const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');
const { Organization, OrganizationRole, Role, User } = require('../../../api/models');

const csrfToken = require('../support/csrfToken');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const { requiresAuthentication } = require('./shared');

function clean() {
  return Promise.all([
    Organization.truncate({
      force: true,
      cascade: true,
    }),
    OrganizationRole.truncate({
      force: true,
      cascade: true,
    }),
    User.truncate({
      force: true,
      cascade: true,
    }),
  ]);
}

describe('Organization Role API', () => {
  let authenticatedRequest;
  let currentUser;
  let userRole;
  let managerRole;

  before(async () => {
    await clean();
    [userRole, managerRole] = await Promise.all([
      Role.findOne({
        where: {
          name: 'user',
        },
      }),
      Role.findOne({
        where: {
          name: 'manager',
        },
      }),
    ]);
  });

  beforeEach(async () => {
    currentUser = await factory.user();
    const cookie = await authenticatedSession(currentUser);
    authenticatedRequest = request.agent(app).set('Cookie', cookie);
  });

  afterEach(clean);

  describe('GET /v0/organization-role', () => {
    requiresAuthentication('GET', '/organization-role');

    it('returns the current users organization roles', async () => {
      const [user, ...orgs] = await Promise.all([
        factory.user(),
        factory.organization.create(),
        factory.organization.create(),
      ]);

      await Promise.all(
        orgs.flatMap((org) => [
          org.addUser(currentUser, {
            through: {
              roleId: userRole.id,
            },
          }),
          org.addUser(user, {
            through: {
              roleId: managerRole.id,
            },
          }),
        ]),
      );

      const response = await authenticatedRequest.get('/v0/organization-role');

      validateAgainstJSONSchema('GET', '/organization-role', 200, response.body);
      expect(response.body.map((or) => or.Organization.id)).to.have.members(
        orgs.map((o) => o.id),
      );
      expect(response.body.map((or) => or.Role.name)).to.have.members(['user', 'user']);
    });
  });

  describe('DELETE /v0/organization/:org_id/user/:user_id', () => {
    requiresAuthentication(
      'DELETE',
      '/organization/1/user/1',
      '/organization/{org_id}/user/{user_id}',
    );

    it('returns a 404 if the user is not a manager of the organization', async () => {
      const [user, org] = await Promise.all([
        factory.user(),
        factory.organization.create(),
      ]);

      await Promise.all([
        org.addUser(currentUser, {
          through: {
            roleId: userRole.id,
          },
        }),
        org.addUser(user, {
          through: {
            roleId: userRole.id,
          },
        }),
      ]);

      const response = await authenticatedRequest
        .delete(`/v0/organization/${org.id}/user/${user.id}`)
        .set('x-csrf-token', csrfToken.getToken());

      validateAgainstJSONSchema(
        'DELETE',
        '/organization/{org_id}/user/{user_id}',
        404,
        response.body,
      );
    });

    it('deletes the organization role and returns an empty object', async () => {
      const [user, org] = await Promise.all([
        factory.user(),
        factory.organization.create(),
      ]);

      await Promise.all([
        org.addUser(currentUser, {
          through: {
            roleId: managerRole.id,
          },
        }),
        org.addUser(user, {
          through: {
            roleId: userRole.id,
          },
        }),
      ]);

      expect(
        await OrganizationRole.count({
          where: {
            organizationId: org.id,
            userId: user.id,
          },
        }),
      ).to.eq(1);

      const response = await authenticatedRequest
        .delete(`/v0/organization/${org.id}/user/${user.id}`)
        .set('x-csrf-token', csrfToken.getToken());

      validateAgainstJSONSchema(
        'DELETE',
        '/organization/{org_id}/user/{user_id}',
        200,
        response.body,
      );

      expect(
        await OrganizationRole.count({
          where: {
            organizationId: org.id,
            userId: user.id,
          },
        }),
      ).to.eq(0);
    });

    it('returns a 404 if the organization is not active', async () => {
      const [user, org] = await Promise.all([
        factory.user(),
        factory.organization.create({
          isActive: false,
        }),
      ]);

      await Promise.all([
        org.addUser(currentUser, {
          through: {
            roleId: managerRole.id,
          },
        }),
        org.addUser(user, {
          through: {
            roleId: userRole.id,
          },
        }),
      ]);

      const response = await authenticatedRequest
        .delete(`/v0/organization/${org.id}/user/${user.id}`)
        .set('x-csrf-token', csrfToken.getToken());

      validateAgainstJSONSchema(
        'DELETE',
        '/organization/{org_id}/user/{user_id}',
        404,
        response.body,
      );

      expect(
        await OrganizationRole.count({
          where: {
            organizationId: org.id,
            userId: user.id,
          },
        }),
      ).to.eq(1);
    });
  });

  describe('PUT /v0/organization-role', () => {
    requiresAuthentication('PUT', '/organization-role');

    it('returns a 404 if the user is not a manager of the organization', async () => {
      const [user, org] = await Promise.all([
        factory.user(),
        factory.organization.create(),
      ]);

      await Promise.all([
        org.addUser(currentUser, {
          through: {
            roleId: userRole.id,
          },
        }),
        org.addUser(user, {
          through: {
            roleId: userRole.id,
          },
        }),
      ]);

      const response = await authenticatedRequest
        .put('/v0/organization-role')
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          organizationId: org.id,
          roledId: managerRole.id,
          userId: user.id,
        });

      validateAgainstJSONSchema('PUT', '/organization-role', 404, response.body);
    });

    it('returns an error if the organization role cannot be updated', async () => {
      const [user, org] = await Promise.all([
        factory.user(),
        factory.organization.create(),
      ]);

      await Promise.all([
        org.addUser(currentUser, {
          through: {
            roleId: managerRole.id,
          },
        }),
        org.addUser(user, {
          through: {
            roleId: userRole.id,
          },
        }),
      ]);

      const response = await authenticatedRequest
        .put('/v0/organization-role')
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          organizationId: org.id,
          userId: user.id,
        });

      validateAgainstJSONSchema('PUT', '/organization-role', 400, response.body);
    });

    it('updates the organization role and returns the new value', async () => {
      const [user, org] = await Promise.all([
        factory.user(),
        factory.organization.create(),
      ]);

      await Promise.all([
        org.addUser(currentUser, {
          through: {
            roleId: managerRole.id,
          },
        }),
        org.addUser(user, {
          through: {
            roleId: userRole.id,
          },
        }),
      ]);

      const orgRole = await OrganizationRole.findOne({
        where: {
          userId: user.id,
          organizationId: org.id,
        },
      });

      expect(orgRole.roleId).to.eq(userRole.id);

      const response = await authenticatedRequest
        .put('/v0/organization-role')
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          organizationId: org.id,
          roleId: managerRole.id,
          userId: user.id,
        });

      validateAgainstJSONSchema('PUT', '/organization-role', 200, response.body);
      expect(response.body.Role.id).to.eq(managerRole.id);

      await orgRole.reload();
      expect(orgRole.roleId).to.eq(managerRole.id);
    });

    it(`returns an error if the organization role cannot
        be updated b/c organization is inactive`, async () => {
      const [user, org] = await Promise.all([
        factory.user(),
        factory.organization.create({
          isActive: false,
        }),
      ]);

      await Promise.all([
        org.addUser(currentUser, {
          through: {
            roleId: managerRole.id,
          },
        }),
        org.addUser(user, {
          through: {
            roleId: userRole.id,
          },
        }),
      ]);

      const orgRole = await OrganizationRole.findOne({
        where: {
          userId: user.id,
          organizationId: org.id,
        },
      });

      expect(orgRole.roleId).to.eq(userRole.id);

      const response = await authenticatedRequest
        .put('/v0/organization-role')
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          organizationId: org.id,
          roleId: managerRole.id,
          userId: user.id,
        });

      validateAgainstJSONSchema('PUT', '/organization-role', 404, response.body);
    });
  });
});
