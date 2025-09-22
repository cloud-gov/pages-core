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
const fs = require('fs').promises;
const { Validator } = require('jsonschema');
const { FileStorageService } = require('../../../../api/models');

const JSON_SCHEMA_PATH = './public/swagger/';

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
      {
        method: 'get',
        path: '/site/:id/file-storage',
      },
      {
        method: 'get',
        path: '/site-file-storage/:id/user-actions',
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
      const response = await request(app)['post']('/sites/:id/file-storage').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns a 200 with successfull site file storage service creation', async () => {
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

  describe('GET /admin/site/:site_id/file-storage', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)['get']('/sites/:id/file-storage').expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns a 200 when checks for existing site file storage service', async () => {
      const user = await factory.user();
      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { site, org } = await stubSiteS3();

      const sfs = await FileStorageService.create({
        siteId: site.id,
        organizationId: org.id,
        name: 'site-storage',
        serviceId: 'AAAA',
        serviceName: 'service name',
      });

      const { body: retrievedSfs } = await request(app)
        .get(`/sites/${site.id}/file-storage`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(200);

      expect(retrievedSfs.siteId).to.be.eq(site.id);
      expect(retrievedSfs.id).to.be.eq(sfs.id);
      validateFileStorageServiceAgainstJSONSchema(retrievedSfs);
    });

    it('returns id:undefined when site file storage service does not exist', async () => {
      const user = await factory.user();
      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);

      const { body: retrievedSfs } = await request(app)
        .get(`/sites/9999/file-storage`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(200);

      expect(retrievedSfs.siteId).to.be.eq(undefined);
    });

    async function validateFileStorageServiceAgainstJSONSchema(fileStorageServiceBody) {
      const validator = new Validator();
      const fileStorageServiceSchema = JSON.parse(
        await fs.readFile(JSON_SCHEMA_PATH + 'FileStorageService.json', 'utf8'),
      );

      validator.validate(fileStorageServiceBody, fileStorageServiceSchema);
    }
  });

  describe('GET /admin/site-file-storage/:id/user-actions', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)
        ['get']('/site-file-storage/:id/user-actions')
        .expect(401);
      expect(response.body.message).to.equal('Unauthorized');
    });

    it('returns 404 when site file storage service does not exist', async () => {
      const user = await factory.user();
      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);

      await request(app)
        .get(`/site-file-storage/9999/user-actions`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.be.eq(
            'The specified site file storage does not exist.',
          );
        });
    });

    it('returns a 200 and an empty collection without user actions', async () => {
      const user = await factory.user();
      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { site, org } = await stubSiteS3();

      const sfs = await FileStorageService.create({
        siteId: site.id,
        organizationId: org.id,
        name: 'site-storage',
        serviceId: 'AAAA',
        serviceName: 'service name',
      });

      const { body: ua } = await request(app)
        .get(`/site-file-storage/${sfs.id}/user-actions`)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(200);

      expect(ua.data.length).to.be.eq(0);
    });

    it('returns a 200 and user actions with default pagination values', async () => {
      const user = await factory.user();
      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { site, org } = await stubSiteS3();

      const sfs = await FileStorageService.create({
        siteId: site.id,
        organizationId: org.id,
        name: 'site-storage',
        serviceId: 'AAAA',
        serviceName: 'service name',
      });

      await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: sfs.id },
        30,
      );
      await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: sfs.id },
        21,
      );

      const endpointUrl = `/site-file-storage/${sfs.id}/user-actions`;
      const { body: userActions } = await request(app)
        .get(endpointUrl)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(200);

      expect(userActions.data.length).to.be.eq(50);
      expect(userActions.currentPage).to.be.eq(1);
      expect(userActions.totalPages).to.be.eq(2);
      expect(userActions.totalItems).to.be.eq(51);

      await validateUserActionsAgainstJSONSchema(userActions);
    });

    it('returns a 200 and user actions for specified page number and size', async () => {
      const user = await factory.user();
      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { site, org } = await stubSiteS3();

      const sfs = await FileStorageService.create({
        siteId: site.id,
        organizationId: org.id,
        name: 'site-storage',
        serviceId: 'AAAA',
        serviceName: 'service name',
      });

      await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: sfs.id },
        100,
      );
      await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: sfs.id },
        100,
      );

      const endpointUrl = `/site-file-storage/${sfs.id}/user-actions/?&limit=10&page=5`;
      const { body: userActions } = await request(app)
        .get(endpointUrl)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(200);

      expect(userActions.data.length).to.be.eq(10);
      expect(userActions.currentPage).to.be.eq(5);
      expect(userActions.totalPages).to.be.eq(20);
      expect(userActions.totalItems).to.be.eq(200);

      await validateUserActionsAgainstJSONSchema(userActions);
    });

    it('returns a 200 and list of user actions sorted by createdAt desc', async () => {
      const user = await factory.user();
      const cookie = await authenticatedAdminOrSupportSession(user, sessionConfig);
      const { site, org } = await stubSiteS3();

      const sfs = await FileStorageService.create({
        siteId: site.id,
        organizationId: org.id,
        name: 'site-storage',
        serviceId: 'AAAA',
        serviceName: 'service name',
      });

      await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: sfs.id },
        1,
      );
      await new Promise((resolve) => setTimeout(resolve, 1));
      await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: sfs.id },
        1,
      );

      const endpointUrl = `/site-file-storage/${sfs.id}/user-actions`;
      const { body: userActions } = await request(app)
        .get(endpointUrl)
        .set('Cookie', cookie)
        .set('Origin', config.app.adminHostname)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(200);

      expect(
        new Date(userActions.data[0].createdAt) > new Date(userActions.data[1].createdAt),
      ).to.be.true;
      await validateUserActionsAgainstJSONSchema(userActions);
    });

    async function validateUserActionsAgainstJSONSchema(userActions) {
      const validator = new Validator();

      const fileStorageUserActionSchema = JSON.parse(
        await fs.readFile(JSON_SCHEMA_PATH + 'FileStorageUserAction.json', 'utf8'),
      );
      validator.addSchema(fileStorageUserActionSchema, '/FileStorageUserAction.json');
      const fileStorageUserActionSchemas = JSON.parse(
        await fs.readFile(JSON_SCHEMA_PATH + 'FileStorageUserActionList.json', 'utf8'),
      );

      validator.validate(userActions, fileStorageUserActionSchemas);
    }
  });
});
