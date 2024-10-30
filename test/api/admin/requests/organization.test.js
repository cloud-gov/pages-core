const request = require('supertest');
const { expect } = require('chai');
const app = require('../../../../api/admin');
const { authenticatedAdminOrSupportSession } = require('../../support/session');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const factory = require('../../support/factory');
const config = require('../../../../config');
const { Organization, User } = require('../../../../api/models');

describe('Admin - Organizations API', () => {
  afterEach(() => Promise.all([User.truncate(), Organization.truncate()]));

  describe('GET /admin/reports/organizations', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)['get']('/reports/organizations').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all organizations', async () => {
      const user = await factory.user();

      const org1 = await factory.organization.create();
      const org2 = await factory.organization.create();

      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { body } = await request(app)
        .get('/reports/organizations')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);

      expect(body.data.length).to.equal(2);
      expect(body.data[0]['id']).to.equal(org1.id);
      expect(body.data[1]['id']).to.equal(org2.id);
    });
  });

  describe('GET /admin/reports/organizations.csv', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)
        ['get']('/reports/organizations.csv')
        .expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all organizations', async () => {
      const user = await factory.user();

      const org1 = await factory.organization.create({
        agency: 'Agency 1',
        isSelfAuthorized: false,
      });
      const org2 = await factory.organization.create({
        agency: 'Agency 2',
        isSelfAuthorized: true,
      });

      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const response = await request(app)
        .get('/reports/organizations.csv')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);
      expect(response.headers['content-type']).to.equal('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).to.equal(
        'attachment; filename="organizations.csv"',
      );
      const [header, ...data] = response.text.split(/\n/);
      expect(header).to.equal('"Organization","Agency","Self Authorized"');
      expect(data.length).to.equal(2);
      expect(data[0]).to.equal(`"${org1.name}","${org1.agency}",false`);
      expect(data[1]).to.equal(`"${org2.name}","${org2.agency}",true`);
    });
  });
});
