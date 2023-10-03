const request = require('supertest');
const { expect } = require('chai');
const app = require('../../../../api/admin');
const { authenticatedSession } = require('../../support/session');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const factory = require('../../support/factory');
const csrfToken = require('../../support/csrfToken');
const config = require('../../../../config');
const {
  Domain,
  Site,
  SiteBranchConfig,
  User,
  Organization,
} = require('../../../../api/models');
const { siteViewOrigin } = require('../../../../api/utils/site');

describe('Admin - Domains API', () => {
  afterEach(() =>
    Promise.all([
      User.truncate(),
      Domain.truncate(),
      Site.truncate(),
      Organization.truncate(),
      SiteBranchConfig.truncate(),
    ])
  );

  describe('Unauthorized domain route requests', async () => {
    const routes = [
      { method: 'get', path: '/domains' },
      { method: 'get', path: '/domains/:id' },
      { method: 'delete', path: '/domains/:id' },
      { method: 'get', path: '/domains/:id/dns' },
      { method: 'get', path: '/domains/:id/dns-result' },
      { method: 'post', path: '/domains/:id/destroy' },
      { method: 'post', path: '/domains/:id/deprovision' },
      { method: 'post', path: '/domains/:id/provision' },
      { method: 'post', path: '/domains' },
    ];

    it('should block all unauthenticated actions', async () => {
      await Promise.all(
        routes.map(async (route) => {
          const response = await request(app)
            [route.method](route.path)
            .expect(401);
          expect(response.body.message).to.equal('Unauthorized');
        })
      );
    });
  });

  describe('GET /admin/reports/published-sites', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)
        ['get']('/reports/published-sites')
        .expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all published sites with their organizations and domains', async () => {
      const user = await factory.user();

      const org = await factory.organization.create();
      const site = await factory.site({ organizationId: org.id });
      const siteBranchConfigId = site.SiteBranchConfigs[0].id;
      const domain = await factory.domain.create({
        siteId: site.id,
        siteBranchConfigId,
        state: 'provisioned',
      });

      const orglessSite = await factory.site();
      const orglessSiteBranchConfigId = orglessSite.SiteBranchConfigs[0].id;
      const orglessDomain = await factory.domain.create({
        siteId: orglessSite.id,
        siteBranchConfigId: orglessSiteBranchConfigId,
        state: 'provisioned',
      });

      const cookie = await authenticatedSession(user, sessionConfig);
      const { body } = await request(app)
        .get('/reports/published-sites')
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

  describe('GET /admin/reports/published-sites.csv', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)
        ['get']('/reports/published-sites.csv')
        .expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns all published sites with their organizations and domains', async () => {
      const user = await factory.user();

      const org = await factory.organization.create({
        name: 'Test Org',
        agency: 'Test Agency',
      });
      const site = await factory.site({ organizationId: org.id });
      const domain = await factory.domain.create({
        siteId: site.id,
        siteBranchConfigId: site.SiteBranchConfigs[0].id,
        state: 'provisioned',
      });

      const orglessSite = await factory.site();
      const orglessDomain = await factory.domain.create({
        siteId: orglessSite.id,
        siteBranchConfigId: orglessSite.SiteBranchConfigs[0].id,
        state: 'provisioned',
      });

      const cookie = await authenticatedSession(user, sessionConfig);
      const response = await request(app)
        .get('/reports/published-sites.csv')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .expect(200);
      expect(response.headers['content-type']).to.equal(
        'text/csv; charset=utf-8'
      );
      expect(response.headers['content-disposition']).to.equal(
        'attachment; filename="published-sites.csv"'
      );
      [header, ...data] = response.text.split(/\n/);
      expect(header).to.equal(
        '"Organization","Agency","Site","Domain","Engine"'
      );
      expect(data.length).to.equal(2);
      expect(data[0]).to.equal(
        `"${org.name}","${org.agency}","${site.repository}","${domain.names}","${site.engine}"`
      );
      expect(data[1]).to.equal(
        `,,"${orglessSite.repository}","${orglessDomain.names}","${orglessSite.engine}"`
      );
    });
  });

  describe('POST /domains', async () => {
    it('should return 404 if the site does not exist', async () => {
      const user = await factory.user();
      const siteId = 8771900;
      const siteBranchConfigId = 1010220;

      const cookie = await authenticatedSession(user, sessionConfig);
      await request(app)
        .post('/domains')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          siteId,
          siteBranchConfigId,
          names: 'www.example.gov',
        })
        .expect(404);
    });

    it('should return 404 if the site branch config does not exist', async () => {
      const user = await factory.user();
      const site = await factory.site({}, { noSiteBranchConfig: true });
      const siteBranchConfigId = 8772274669;

      const cookie = await authenticatedSession(user, sessionConfig);
      await request(app)
        .post('/domains')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          siteId: site.id,
          siteBranchConfigId,
          names: 'www.example.gov',
        })
        .expect(404);
    });

    it('should return 400 if the site branch config does not match the site', async () => {
      const user = await factory.user();
      const site = await factory.site({}, { noSiteBranchConfig: true });
      const otherSite = await factory.site();
      const otherSBC = otherSite.SiteBranchConfigs[0];

      const cookie = await authenticatedSession(user, sessionConfig);
      const response = await request(app)
        .post('/domains')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          siteId: site.id,
          siteBranchConfigId: otherSBC.id,
          names: 'www.example.gov',
        })
        .expect(400);

      expect(response.body.message).to.equal(
        'The site and site branch config are not related.'
      );
    });

    it('should return 400 if the site branch config is a "preview" context', async () => {
      const user = await factory.user();
      const site = await factory.site({}, { noSiteBranchConfig: true });
      const sbc = await factory.siteBranchConfig.create({
        site,
        context: 'preview',
      });

      const cookie = await authenticatedSession(user, sessionConfig);
      const response = await request(app)
        .post('/domains')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          siteId: site.id,
          siteBranchConfigId: sbc.id,
          names: 'www.example.gov',
        })
        .expect(400);

      expect(response.body.message).to.equal(
        'The site branch config cannot have the context of "preview".'
      );
    });

    it('should create a new domain for a site based on the site branch config', async () => {
      const names = 'www.example.gov';
      const user = await factory.user();
      const site = await factory.site();
      const sbc = site.SiteBranchConfigs[0];

      const cookie = await authenticatedSession(user, sessionConfig);
      const response = await request(app)
        .post('/domains')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          siteId: site.id,
          siteBranchConfigId: sbc.id,
          names,
        })
        .expect(200);

      const origin = siteViewOrigin(site);
      const { body } = response;

      expect(body.names).to.equal(names);
      expect(body.path).to.equal(sbc.s3Key);
      expect(body.origin).to.equal(origin);
      expect(body.serviceName).to.equal(`${names}-ext`);
    });

    it('should create a new domain for a site with multiple names', async () => {
      const name1 = 'www.example.gov';
      const name2 = 'other.example.gov';
      const names = `${name1},${name2}`;
      const user = await factory.user();
      const site = await factory.site();
      const sbc = site.SiteBranchConfigs[0];

      const cookie = await authenticatedSession(user, sessionConfig);
      const response = await request(app)
        .post('/domains')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .send({
          siteId: site.id,
          siteBranchConfigId: sbc.id,
          names,
        })
        .expect(200);

      const origin = siteViewOrigin(site);
      const { body } = response;

      expect(body.names).to.equal(names);
      expect(body.path).to.equal(sbc.s3Key);
      expect(body.origin).to.equal(origin);
      expect(body.serviceName).to.equal(`${name1}-ext`);
    });
  });
});
