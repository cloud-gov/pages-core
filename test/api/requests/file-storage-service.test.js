const request = require('supertest');
const sinon = require('sinon');
const factory = require('../support/factory');
const csrfToken = require('../support/csrfToken');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const app = require('../../../app');
const EventCreator = require('../../../api/services/EventCreator');
const { stubSiteS3 } = require('../support/file-storage-service');

describe('File Storgage API', () => {
  beforeEach(async () => {
    sinon.stub(EventCreator, 'error').resolves();
    await factory.organization.truncate();
  });

  afterEach(async () => {
    sinon.restore();
    await factory.organization.truncate();
  });

  describe.only('POST /v0/file-storage/:file_storage_id/directory', () => {
    const endpoint = '/file-storage/{file_storage_id}/directory';

    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const fssId = 1;

        const { body } = await request(app)
          .post(`/v0/file-storage/${fssId}/directory`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('POST', endpoint, 403, body);
      });
    });

    describe('when there is no csrf token', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/file-storage/${siteId}/directory`)
          .set('Cookie', cookie)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema('POST', endpoint, 403, body);
      });
    });

    describe('when a manager creates a valid site file storage', () => {
      it.only('returns a 200', async () => {
        const { site, org, user } = await stubSiteS3({
          roleName: 'manager',
        });
        const fss = await factory.fileStorageService.create({
          siteId: site.id,
          serviceName: site.s3ServiceName,
          org,
        });
        const cookie = await authenticatedSession(user);
        const payload = { parent: 'cool', name: 'runnings' };

        const { body } = await request(app)
          .post(`/v0/file-storage/${fss.id}/directory`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send(payload)
          .expect(200);

        validateAgainstJSONSchema('POST', endpoint, 200, body);
      });
    });
  });
});
