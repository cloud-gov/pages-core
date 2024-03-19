const request = require('supertest');
const { expect } = require('chai');
const { restore, stub } = require('sinon');

const validateAgainstJSONSchema = require('../../support/validateAgainstJSONSchema');
const { authenticatedAdminOrSupportSession } = require('../../support/session');
const factory = require('../../support/factory');
const csrfToken = require('../../support/csrfToken');

const config = require('../../../../config');
const { Site, User } = require('../../../../api/models');
const S3SiteRemover = require('../../../../api/services/S3SiteRemover');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const app = require('../../../../api/admin');

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

      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { body } = await request(app)
        .get('/sites')
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
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

      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { body } = await request(app)
        .get(`/sites/${site.id}`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
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
    context('updates allowed fields', async () => {
      it('updates containerConfig', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site({ containerConfig: origContainerConfig }),
        ]);

        const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
        const putResponse = await request(app)
          .put(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .set('x-csrf-token', csrfToken.getToken())
          .send({
            containerConfig: newContainerConfig,
            isActive: false,
          })
          .expect(200);

        expect(putResponse.body.containerConfig).to.deep.equal(newContainerConfig);

        // Requery
        const getResponse = await request(app)
          .get(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .expect(200);

        expect(getResponse.body.containerConfig).to.deep.equal(newContainerConfig);
      });

      it('updates isActive', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site(),
        ]);
        expect(site.isActive).to.be.true;
        const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
        const putResponse = await request(app)
          .put(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .set('x-csrf-token', csrfToken.getToken())
          .send({
            isActive: false,
          })
          .expect(200);

        expect(putResponse.body.isActive).to.be.false;

        // Requery
        const getResponse = await request(app)
          .get(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .expect(200);

        expect(getResponse.body.isActive).to.be.false;
      });
    });
  });

  describe('DELETE /admin/sites/:id', () => {
    itShouldRequireAdminAuthentication('/sites/1', '/site/{id}', 'delete');

    describe('default', () => {
      beforeEach(() => {
        stub(S3SiteRemover, 'removeSite').resolves();
        stub(S3SiteRemover, 'removeInfrastructure').resolves();
      });

      afterEach(() => {
        restore();
      });

      it('deletes the following site', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site(),
        ]);

        expect(site.isSoftDeleted()).to.be.false;

        const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
        const deleteResponse = await request(app)
          .delete(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .set('x-csrf-token', csrfToken.getToken())
          .expect(200);

        expect(deleteResponse.body).to.deep.eq({});

        await site.reload({ paranoid: false });
        expect(site.isSoftDeleted()).to.be.true;

        // Requery
        await request(app)
          .get(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .expect(404);
      });
    });

    describe('With an error', () => {
      beforeEach(() => {
        stub(S3SiteRemover, 'removeSite').rejects();
      });

      afterEach(() => {
        restore();
      });

      it('deletes the site', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site(),
        ]);

        expect(site.isSoftDeleted()).to.be.false;

        const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
        const deleteResponse = await request(app)
          .delete(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .set('x-csrf-token', csrfToken.getToken())
          .expect(200);

        expect(deleteResponse.body).to.deep.eq({});

        await site.reload({ paranoid: false });
        expect(site.isSoftDeleted()).to.be.true;

        // Requery
        await request(app)
          .get(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .expect(404);
      });
    });

    describe('Support role', () => {
      it('fails for support role', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site(),
        ]);

        const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig, 'pages.support');
        await request(app)
          .delete(`/sites/${site.id}`)
          .set('Cookie', cookie)
          .set('Origin', config.app.adminHostname)
          .set('x-csrf-token', csrfToken.getToken())
          .expect(403);
      });
    });
  });
});
