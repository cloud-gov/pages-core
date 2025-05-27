const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const app = require('../../../../api/admin');
const { authenticatedAdminOrSupportSession } = require('../../support/session');
const sessionConfig = require('../../../../api/admin/sessionConfig');
const factory = require('../../support/factory');
const csrfToken = require('../../support/csrfToken');
const config = require('../../../../config');
const EventCreator = require('../../../../api/services/EventCreator');
const siteErrors = require('../../../../api/responses/siteErrors');
const {
  createFileStorageServiceClient,
  stubSiteS3,
} = require('../../support/file-storage-service');

describe('Admin File-Storage API', () => {
  beforeEach(async () => {
    sinon.stub(EventCreator, 'error').resolves();
    await factory.organization.truncate();
  });

  afterEach(async () => {
    sinon.restore();
    await factory.organization.truncate();
  });

  describe('Unauthorized domain route requests', async () => {
    const routes = [
      {
        method: 'post',
        path: '/site/:id/file-storage',
      },
    ];

    it('should block all unauthenticated actions', async () => {
      await Promise.all(
        routes.map(async (route) => {
          const response = await request(app)[route.method](route.path).expect(401);
          expect(response.body.message).to.equal('Unauthorized');
        }),
      );
    });
  });

  describe('POST /admin/site/:site_id/file-storage', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)['get']('/sites/:id/file-storage').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns a 200 with successful site file storage service creation', async () => {
      const user = await factory.user();
      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { site } = await stubSiteS3();

      const { body } = await request(app)
        .post(`/sites/${site.id}/file-storage`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(200);

      expect(body.siteId).to.be.eq(site.id);
    });

    it('returns a 403 with an existing site file storage service', async () => {
      const user = await factory.user();
      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { site } = await createFileStorageServiceClient();

      const { body } = await request(app)
        .post(`/sites/${site.id}/file-storage`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(403);

      expect(body.message).to.be.eq(siteErrors.SITE_FILE_STORAGE_EXISTS);
    });
  });
});
