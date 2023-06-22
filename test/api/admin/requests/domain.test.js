const request = require('supertest');
const { expect } = require('chai');

const { authenticatedSession } = require('../../support/session');
const factory = require('../../support/factory');

const config = require('../../../../config');
const { Domain, Site, User, Organization } = require('../../../../api/models');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const app = require('../../../../api/admin');

describe('Admin - Domains API', () => {
  afterEach(() => Promise.all([
    User.truncate(),
    Domain.truncate(),
    Site.truncate(),
    Organization.truncate(),
  ]));

  describe('GET /admin/organizations-report', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)['get']('/organizations-report').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all published sites with their organizations and domains', async () => {
      const user = await factory.user();

      const org = await factory.organization.create();
      const site = await factory.site({organizationId: org.id });
      const domain = await factory.domain.create({ siteId: site.id, state: "provisioned" });

      const orglessSite = await factory.site();
      const orglessDomain = await factory.domain.create({ siteId: orglessSite.id, state: "provisioned" });

      const cookie = await authenticatedSession(user, sessionConfig);
      const { body } = await request(app)
        .get('/organizations-report')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);

      expect(body.data.length).to.equal(2);
      expect(body.data[0]['id']).to.equal(domain.id);
      expect(body.data[0]['Site']['id']).to.equal(site.id);
      expect(body.data[0]['Site']['Organization']['id']).to.equal(org.id);

      expect(body.data[1]['id']).to.equal(orglessDomain.id);
      expect(body.data[1]['Site']['id']).to.equal(orglessSite.id);
      expect(body.data[1]['Site']['Organization']).to.be.undefined;
    });
  });

  describe('GET /admin/organizations-report.csv', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)['get']('/organizations-report.csv').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all published sites with their organizations and domains', async () => {
      const user = await factory.user();

      const org = await factory.organization.create({name: 'Test Org', agency: 'Test Agency'});
      const site = await factory.site({organizationId: org.id });
      const domain = await factory.domain.create({ siteId: site.id, state: "provisioned" });

      const orglessSite = await factory.site();
      const orglessDomain = await factory.domain.create({ siteId: orglessSite.id, state: "provisioned" });

      const cookie = await authenticatedSession(user, sessionConfig);
      const response  = await request(app)
        .get('/organizations-report.csv')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);
      expect(response.headers["content-type"]).to.equal('text/csv; charset=utf-8');
      expect(response.headers["content-disposition"]).to.equal('attachment; filename="organizations-report.csv"');
      [header,...data] = response.text.split(/\n/);
      expect(header).to.equal('"Organization","Agency","Site","Domain","Engine"');
      expect(data.length).to.equal(2);
      expect(data[0]).to.equal(`"${org.name}","${org.agency}","${site.repository}","${domain.names}","${site.engine}"`);
      expect(data[1]).to.equal(`,,"${orglessSite.repository}","${orglessDomain.names}","${orglessSite.engine}"`);
    });
  });


});
