const request = require('supertest');
const { expect } = require('chai');
const { restore, stub } = require('sinon');

const validateAgainstJSONSchema = require('../../support/validateAgainstJSONSchema');
const { authenticatedSession } = require('../../support/session');
const factory = require('../../support/factory');

const { Site, User } = require('../../../../api/models');
const S3SiteRemover = require('../../../../api/services/S3SiteRemover');
const ProxyDataSync = require('../../../../api/services/ProxyDataSync');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const { serializeNew } = require('../../../../api/serializers/site');
const app = require('../../../../api/admin');

const defaultProxyEgeLinks = process.env.FEATURE_PROXY_EDGE_LINKS;

const itShouldRequireAdminAuthentication = (path, schema, method = 'get') => {
  it('should require admin authentication', async () => {
    const response = await request(app)[method](path)
      .expect(401);

    validateAgainstJSONSchema('GET', schema, 401, response.body);
    expect(response.body.message).to.equal('Unauthorized');
  });
};

describe('Admin - Site API', () => {
  afterEach(() => Promise.all([
    User.truncate(),
    Site.truncate(),
  ]));

  describe('GET /admin/sites', () => {
    itShouldRequireAdminAuthentication('/sites', '/site');

    it('returns all sites with admin serialization', async () => {
      const [user, ...sites] = await Promise.all([
        factory.user(),
        factory.site(),
        factory.site(),
      ]);

      const cookie = await authenticatedSession(user, sessionConfig);
      const { body } = await request(app)
        .get('/sites')
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('GET', '/site', 200, body.data);
      expect(body.data.map(site => site.id)).to.deep.equal(sites.map(s => s.id));
      expect(body.data[0].containerConfig).to.deep.equal({});
    });
  });

  describe('GET /admin/sites/:id', () => {
    itShouldRequireAdminAuthentication('/sites/1', '/site/{id}');

    it('returns the site with admin serialization', async () => {
      const containerConfig = { name: 'name', size: 'size' };

      const [user, site] = await Promise.all([
        factory.user(),
        factory.site({ containerConfig }),
      ]);

      const cookie = await authenticatedSession(user, sessionConfig);
      const { body } = await request(app)
        .get(`/sites/${site.id}`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('GET', '/site/{id}', 200, body);
      expect(body.id).to.equal(site.id);
      expect(body.containerConfig).to.deep.equal(containerConfig);
    });
  });
  describe('PUT /admin/sites/:id', () => {
    itShouldRequireAdminAuthentication('/sites/1', '/site/{id}', 'put');

    const origContainerConfig = { name: 'exp', size: '' };
    const newContainerConfig = { name: '', size: 'large' };

    it('updates allowed fields', async () => {
      const [user, site] = await Promise.all([
        factory.user(),
        factory.site({ containerConfig: origContainerConfig }),
      ]);

      const cookie = await authenticatedSession(user, sessionConfig);
      const putResponse = await request(app)
        .put(`/sites/${site.id}`)
        .set('Cookie', cookie)
        .send({
          containerConfig: newContainerConfig,
        })
        .expect(200);

      expect(putResponse.body.containerConfig).to.deep.equal(newContainerConfig);

      // Requery
      const getResponse = await request(app)
        .get(`/sites/${site.id}`)
        .set('Cookie', cookie)
        .expect(200);

      expect(getResponse.body.containerConfig).to.deep.equal(newContainerConfig);
    });
  });

  describe('DELETE /admin/sites/:id', () => {
    itShouldRequireAdminAuthentication('/sites/1', '/site/{id}', 'delete');

    describe('Without FEATURE_PROXY_EDGE_DYNAMO', () => {
      beforeEach(() => {
        process.env.FEATURE_PROXY_EDGE_DYNAMO = '';
        stub(S3SiteRemover, 'removeSite').resolves();
        stub(S3SiteRemover, 'removeInfrastructure').resolves();
      });

      afterEach(() => {
        process.env.FEATURE_PROXY_EDGE_DYNAMO = defaultProxyEgeLinks;
        restore();
      });

      it('deletes the following site', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site(),
        ]);

        const expectedResponse = serializeNew(site, true);
        const cookie = await authenticatedSession(user, sessionConfig);
        const deleteResponse = await request(app)
          .delete(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .expect(200);

        // Check updatedAt is later
        expect(new Date(deleteResponse.body.updatedAt))
          .to.be.above(new Date(expectedResponse.updatedAt));

        // Remove updatedAt to deep equal other properties
        delete deleteResponse.body.updatedAt;
        delete expectedResponse.updatedAt;
        expect(deleteResponse.body).to.deep.equal(expectedResponse);

        // Requery
        await request(app)
          .get(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .expect(404);
      });
    });

    describe('With FEATURE_PROXY_EDGE_DYNAMO', () => {
      beforeEach(() => {
        process.env.FEATURE_PROXY_EDGE_DYNAMO = 'true';
        stub(S3SiteRemover, 'removeSite').resolves();
        stub(S3SiteRemover, 'removeInfrastructure').resolves();
        stub(ProxyDataSync, 'removeSite').resolves();
      });

      afterEach(() => {
        process.env.FEATURE_PROXY_EDGE_DYNAMO = defaultProxyEgeLinks;
        restore();
      });

      it('deletes the following site', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site(),
        ]);

        const expectedResponse = serializeNew(site, true);
        const cookie = await authenticatedSession(user, sessionConfig);
        const deleteResponse = await request(app)
          .delete(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .expect(200);

        // Check updatedAt is later
        expect(new Date(deleteResponse.body.updatedAt))
          .to.be.above(new Date(expectedResponse.updatedAt));

        // Remove updatedAt to deep equal other properties
        delete deleteResponse.body.updatedAt;
        delete expectedResponse.updatedAt;
        expect(deleteResponse.body).to.deep.equal(expectedResponse);

        // Requery
        await request(app)
          .get(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .expect(404);
      });
    });

    describe('With an error', () => {
      beforeEach(() => {
        process.env.FEATURE_PROXY_EDGE_DYNAMO = '';
        stub(S3SiteRemover, 'removeSite').rejects();
      });

      afterEach(() => {
        restore();
      });

      it('returns a 500 response', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site(),
        ]);

        const cookie = await authenticatedSession(user, sessionConfig);
        const { body } = await request(app)
          .delete(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .expect(500);

        expect(body.message).to.equal('An unexpected error occurred');
        expect(body.status).to.equal(500);
      });
    });
  });
});
