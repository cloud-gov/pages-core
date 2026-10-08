const request = require('supertest');
const { expect } = require('chai');

const { authenticatedAdminOrSupportSession } = require('../../support/session');
const factory = require('../../support/factory');
const csrfToken = require('../../support/csrfToken');

const config = require('../../../../config');
const { User } = require('../../../../api/models');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const app = require('../../../../api/admin');

const routes = [
  ['get', '/me'],
  ['get', '/sites'],
  ['get', '/builds'],
  ['get', '/organizations'],
  ['get', '/reports/users'],
  ['post', '/organizations'],
  ['put', '/organization-role'],
];

describe('Admin - API authorization', () => {
  afterEach(() => User.truncate());

  describe('when the user is not authenticated', () => {
    routes.forEach(([method, path]) => {
      it(`returns a 401 for ${method.toUpperCase()} ${path}`, async () => {
        const response = await request(app)
          [method](path)
          .set('Origin', config.app.adminHostname)
          .expect(401);

        expect(response.body.message).to.equal('Unauthorized');
      });
    });
  });

  describe('when the user does not have an admin or support role', () => {
    const roles = ['pages.user', 'pages.admin.fake', null];

    roles.forEach((role) => {
      routes.forEach(([method, path]) => {
        it(`returns a 403 for ${method.toUpperCase()} ${path} as ${role}`, async () => {
          const user = await factory.user();
          const cookie = await authenticatedAdminOrSupportSession(
            user,
            sessionConfig,
            role,
          );

          const response = await request(app)
            [method](path)
            .set('Cookie', cookie)
            .set('Origin', config.app.adminHostname)
            .set('x-csrf-token', csrfToken.getToken())
            .expect(403);

          expect(response.body.message).to.equal(
            'You are not authorized to perform that action',
          );
        });
      });
    });
  });

  describe('when the user has an admin or support role', () => {
    const roles = ['pages.admin', 'pages.support'];

    roles.forEach((role) => {
      it(`returns a 200 for GET /me with role ${role}`, async () => {
        const user = await factory.user();
        const cookie = await authenticatedAdminOrSupportSession(
          user,
          sessionConfig,
          role,
        );

        const { body } = await request(app)
          .get('/me')
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .expect(200);

        expect(body.id).to.equal(user.id);
      });
    });
  });
});
