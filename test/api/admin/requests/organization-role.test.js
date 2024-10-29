const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../../api/admin');
const { Organization, OrganizationRole, Role, User } = require('../../../../api/models');

const csrfToken = require('../../support/csrfToken');
const factory = require('../../support/factory');
const { authenticatedAdminOrSupportSession } = require('../../support/session');
const config = require('../../../../config');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const validateAgainstJSONSchema = require('../../support/validateAgainstJSONSchema');

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

const itShouldRequireAdminAuthentication = (path, schema, method = 'get') => {
  it('should require admin authentication', async () => {
    const response = await request(app)[method](path).expect(401);

    validateAgainstJSONSchema(method, schema, 403, response.body);
    expect(response.body.message).to.equal('Unauthorized');
  });
};

describe('Organization Role Admin API', () => {
  let authenticatedRequest;
  let supportRequest;
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
    const cookie = await authenticatedAdminOrSupportSession(currentUser, sessionConfig);
    authenticatedRequest = request.agent(app).set('Cookie', cookie);
    const supportCookie = await authenticatedAdminOrSupportSession(
      currentUser,
      sessionConfig,
      'pages.support',
    );
    supportRequest = request.agent(app).set('Cookie', supportCookie);
  });

  afterEach(clean);

  describe('DELETE /admin/organization/:org_id/user/:user_id', () => {
    itShouldRequireAdminAuthentication(
      '/organization/1/user/1',
      '/organization/{org_id}/user/{user_id}',
      'delete',
    );

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
        .delete(`/organization/${org.id}/user/${user.id}`)
        .set('Origin', config.app.adminHostname)
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

    it('fails to delete for support role', async () => {
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

      const response = await supportRequest
        .delete(`/organization/${org.id}/user/${user.id}`)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .expect(403);

      validateAgainstJSONSchema(
        'DELETE',
        '/organization/{org_id}/user/{user_id}',
        403,
        response.body,
      );
    });
  });

  describe('PUT /admin/organization-role', () => {
    itShouldRequireAdminAuthentication('/organization-role', '/organization-role', 'put');

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
        .put('/organization-role')
        .set('Origin', config.app.adminHostname)
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
        .put('/organization-role')
        .set('Origin', config.app.adminHostname)
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
  });
});
