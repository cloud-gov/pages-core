const request = require('supertest');
const { expect } = require('chai');
const app = require('../../../../api/admin');
const { authenticatedAdminOrSupportSession } = require('../../support/session');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const factory = require('../../support/factory');
const config = require('../../../../config');
const {
  Organization,
  OrganizationRole,
  Role,
  User,
  UAAIdentity,
} = require('../../../../api/models');
const { createUAAIdentity } = require('../../support/factory/uaa-identity');

describe('Admin - Users API', () => {
  let userRole;
  let managerRole;

  before(async () => {
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

  afterEach(async () => {
    await Organization.truncate({
      force: true,
      cascade: true,
    });
    await OrganizationRole.truncate({
      force: true,
      cascade: true,
    });
    await UAAIdentity.truncate({
      force: true,
      cascade: true,
    });
    await User.truncate({
      force: true,
      cascade: true,
    });
  });

  describe('GET /admin/reports/users', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)['get']('/reports/users').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all users', async () => {
      const user1 = await factory.user();
      const user2 = await factory.user();

      const org1 = await factory.organization.create();
      const org2 = await factory.organization.create();

      org1.addUser(user1, {
        through: {
          roleId: managerRole.id,
        },
      });
      org1.addUser(user2, {
        through: {
          roleId: userRole.id,
        },
      });
      org2.addUser(user1, {
        through: {
          roleId: userRole.id,
        },
      });

      const cookie = await authenticatedAdminOrSupportSession(user1, sessionConfig);
      const { body } = await request(app)
        .get('/reports/users')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);

      expect(body.data.length).to.equal(2);
      const ids = body.data.map((user) => user['id']);
      expect(ids).to.include(user1.id);
      expect(ids).to.include(user2.id);
    });
  });

  describe('GET /admin/reports/users.csv', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)['get']('/reports/users.csv').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all users', async () => {
      const user1 = await factory.user();
      await createUAAIdentity({
        uaaId: 'user_id_1',
        email: 'user1@example.com',
        userId: user1.id,
      });

      const user2 = await factory.user();
      await createUAAIdentity({
        uaaId: 'user_id_2',
        email: 'user2@example.com',
        userId: user2.id,
      });

      const org1 = await factory.organization.create();
      const org2 = await factory.organization.create();

      await org1.addUser(user1, {
        through: {
          roleId: managerRole.id,
        },
      });
      await org1.addUser(user2, {
        through: {
          roleId: userRole.id,
        },
      });
      await org2.addUser(user1, {
        through: {
          roleId: userRole.id,
        },
      });

      const cookie = await authenticatedAdminOrSupportSession(user1, sessionConfig);
      const response = await request(app)
        .get('/reports/users.csv')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);
      expect(response.headers['content-type']).to.equal('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).to.equal(
        'attachment; filename="users.csv"',
      );
      const [header, ...data] = response.text.split(/\n/);
      expect(header).to.equal(
        '"ID","Email","Organizations","Details","Created","Last Signed In"',
      );
      expect(data.length).to.equal(2);
      expect(data).to.include(
        // eslint-disable-next-line max-len
        `${user1.id},"user1@example.com","${org1.name}|${org2.name}","${org1.name}: manager, ${org2.name}: user","${user1.createdAt.toISOString()}","${user1.signedInAt.toISOString()}"`,
      );
      expect(data).to.include(
        // eslint-disable-next-line max-len
        `${user2.id},"user2@example.com","${org1.name}","${org1.name}: user","${user2.createdAt.toISOString()}","${user2.signedInAt.toISOString()}"`,
      );
    });
  });

  describe('GET /admin/reports/active-users', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)['get']('/reports/active-users').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all users with UAA identities', async () => {
      const user1 = await factory.user();
      await createUAAIdentity({
        uaaId: 'user_id_1',
        email: 'user1@example.com',
        userId: user1.id,
      });

      const user2 = await factory.user();
      await createUAAIdentity({
        uaaId: 'user_id_2',
        email: 'user2@example.com',
        userId: user2.id,
      });

      const user3 = await factory.user();
      const user4 = await factory.user();

      const org1 = await factory.organization.create();
      const org2 = await factory.organization.create();

      org1.addUser(user1, {
        through: {
          roleId: managerRole.id,
        },
      });
      org1.addUser(user2, {
        through: {
          roleId: userRole.id,
        },
      });
      org2.addUser(user1, {
        through: {
          roleId: userRole.id,
        },
      });

      org1.addUser(user3, {
        through: {
          roleId: managerRole.id,
        },
      });
      org1.addUser(user4, {
        through: {
          roleId: userRole.id,
        },
      });
      org2.addUser(user3, {
        through: {
          roleId: userRole.id,
        },
      });

      const cookie = await authenticatedAdminOrSupportSession(user1, sessionConfig);
      const { body } = await request(app)
        .get('/reports/active-users')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);

      expect(body.data.length).to.equal(2);
      const ids = body.data.map((user) => user['id']);
      expect(ids).to.include(user1.id);
      expect(ids).to.include(user2.id);
      expect(ids).to.not.include(user3.id);
      expect(ids).to.not.include(user4.id);
    });
  });

  describe('GET /admin/reports/active-users.csv', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)['get']('/reports/active-users.csv').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all users with UAA identities', async () => {
      const user1 = await factory.user();
      await createUAAIdentity({
        uaaId: 'user_id_1',
        email: 'user1@example.com',
        userId: user1.id,
      });

      const user2 = await factory.user();
      await createUAAIdentity({
        uaaId: 'user_id_2',
        email: 'user2@example.com',
        userId: user2.id,
      });

      const user3 = await factory.user();
      const user4 = await factory.user();

      const org1 = await factory.organization.create();
      const org2 = await factory.organization.create();

      org1.addUser(user1, {
        through: {
          roleId: managerRole.id,
        },
      });
      org1.addUser(user2, {
        through: {
          roleId: userRole.id,
        },
      });
      org2.addUser(user1, {
        through: {
          roleId: userRole.id,
        },
      });

      org1.addUser(user3, {
        through: {
          roleId: managerRole.id,
        },
      });
      org1.addUser(user4, {
        through: {
          roleId: userRole.id,
        },
      });
      org2.addUser(user3, {
        through: {
          roleId: userRole.id,
        },
      });

      const cookie = await authenticatedAdminOrSupportSession(user1, sessionConfig);
      const response = await request(app)
        .get('/reports/active-users.csv')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);
      expect(response.headers['content-type']).to.equal('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).to.equal(
        'attachment; filename="users.csv"',
      );
      const [header, ...data] = response.text.split(/\n/);
      expect(header).to.equal(
        '"ID","Email","Organizations","Details","Created","Last Signed In"',
      );
      expect(data.length).to.equal(2);
      expect(data).to.include(
        // eslint-disable-next-line max-len
        `${user1.id},"user1@example.com","${org1.name}|${org2.name}","${org1.name}: manager, ${org2.name}: user","${user1.createdAt.toISOString()}","${user1.signedInAt.toISOString()}"`,
      );
      expect(data).to.include(
        // eslint-disable-next-line max-len
        `${user2.id},"user2@example.com","${org1.name}","${org1.name}: user","${user2.createdAt.toISOString()}","${user2.signedInAt.toISOString()}"`,
      );
    });
  });
});
