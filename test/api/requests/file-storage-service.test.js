const path = require('node:path');
const { expect } = require('chai');
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

  describe('GET /v0/file-storage/:file_storage_id', () => {
    const endpoint = '/file-storage/{file_storage_id}';

    it('returns a 403', async () => {
      const fssId = 1;

      const { body } = await request(app)
        .get(`/v0/file-storage/${fssId}`)
        .type('json')
        .expect(403);

      validateAgainstJSONSchema('GET', endpoint, 403, body);
    });

    it('must be a org user', async () => {
      const nonOrgUser = await factory.user();
      const { site, org } = await stubSiteS3();
      const fss = await factory.fileStorageService.create({
        siteId: site.id,
        serviceName: site.s3ServiceName,
        org,
      });
      const cookie = await authenticatedSession(nonOrgUser);

      const { body } = await request(app)
        .get(`/v0/file-storage/${fss.id}`)
        .set('Cookie', cookie)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(403);

      validateAgainstJSONSchema('GET', endpoint, 403, body);
    });

    describe('when a user lists directory', () => {
      it('returns a 200 when empty', async () => {
        const { site, org, user } = await stubSiteS3({
          roleName: 'manager',
        });
        const fss = await factory.fileStorageService.create({
          siteId: site.id,
          serviceName: site.s3ServiceName,
          org,
        });
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/file-storage/${fss.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        validateAgainstJSONSchema('GET', endpoint, 200, body);
      });

      it('returns a list of items in the directory path', async () => {
        const { site, org, user } = await stubSiteS3();
        const fss = await factory.fileStorageService.create({
          siteId: site.id,
          serviceName: site.s3ServiceName,
          org,
        });

        const dir = '~assets/b/c/';
        const subdir = `${dir}/d/`;
        const expectedList = await factory.fileStorageFile.createBulk(fss.id, dir, {
          files: 10,
          directories: 2,
        });
        const expectedCount = expectedList.files.length + expectedList.directories.length;
        await factory.fileStorageFile.createBulk(fss.id, subdir, {
          files: 2,
          directories: 1,
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/file-storage/${fss.id}?path=${dir}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        expect(body.currentPage).to.be.eq(1);
        expect(body.totalPages).to.be.eq(1);
        expect(body.data.length).to.be.eq(expectedCount);
        expect(body.totalItems).to.be.eq(expectedCount);
        validateAgainstJSONSchema('GET', endpoint, 200, body);
      });

      it('returns a list of items in the default root directory', async () => {
        const { site, org, user } = await stubSiteS3();
        const fss = await factory.fileStorageService.create({
          siteId: site.id,
          serviceName: site.s3ServiceName,
          org,
        });

        const dir = '~assets/';
        const subdir = `${dir}/d/`;
        const expectedList = await factory.fileStorageFile.createBulk(fss.id, dir, {
          files: 10,
          directories: 2,
        });
        const expectedCount = expectedList.files.length + expectedList.directories.length;
        await factory.fileStorageFile.createBulk(fss.id, subdir, {
          files: 2,
          directories: 1,
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .get(`/v0/file-storage/${fss.id}`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        expect(body.currentPage).to.be.eq(1);
        expect(body.totalPages).to.be.eq(1);
        expect(body.data.length).to.be.eq(expectedCount);
        expect(body.totalItems).to.be.eq(expectedCount);
        validateAgainstJSONSchema('GET', endpoint, 200, body);
      });
    });

    it('returns page 2 with a page size of 2 from the list', async () => {
      const { site, org, user } = await stubSiteS3();
      const fss = await factory.fileStorageService.create({
        siteId: site.id,
        serviceName: site.s3ServiceName,
        org,
      });

      const dir = '~assets/a/';
      const subdir = `${dir}/b/`;
      const page = 2;
      const limit = 2;
      const expectedList = await factory.fileStorageFile.createBulk(fss.id, dir, {
        files: 10,
        directories: 2,
      });
      const expectedCount = expectedList.files.length + expectedList.directories.length;
      await factory.fileStorageFile.createBulk(fss.id, subdir, {
        files: 2,
        directories: 1,
      });

      const cookie = await authenticatedSession(user);

      const { body } = await request(app)
        .get(`/v0/file-storage/${fss.id}?path=${dir}&limit=${limit}&page=${page}`)
        .set('Cookie', cookie)
        .set('x-csrf-token', csrfToken.getToken())
        .type('json')
        .expect(200);

      expect(body.currentPage).to.be.eq(page);
      expect(body.totalPages).to.be.eq(expectedCount / limit);
      expect(body.data.length).to.be.eq(limit);
      expect(body.totalItems).to.be.eq(expectedCount);
      validateAgainstJSONSchema('GET', endpoint, 200, body);
    });
  });

  describe('POST /v0/file-storage/:file_storage_id/directory', () => {
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

    describe('when a user creates a valid directory', () => {
      it('returns a 200', async () => {
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

  describe('POST /v0/file-storage/:file_storage_id/upload', () => {
    const endpoint = '/file-storage/{file_storage_id}/upload';

    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const fssId = 1;

        const { body } = await request(app)
          .post(`/v0/file-storage/${fssId}/upload`)
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
          .post(`/v0/file-storage/${siteId}/upload`)
          .set('Cookie', cookie)
          .expect(403);

        validateAgainstJSONSchema('POST', endpoint, 403, body);
      });
    });

    describe('when a user uploads a valid file', () => {
      it('returns a 200', async () => {
        const { site, org, user } = await stubSiteS3({
          roleName: 'manager',
        });
        const fss = await factory.fileStorageService.create({
          siteId: site.id,
          serviceName: site.s3ServiceName,
          org,
        });
        const cookie = await authenticatedSession(user);
        const name = 'test.txt';
        const parent = 'parent/';

        const { body } = await request(app)
          .post(`/v0/file-storage/${fss.id}/upload`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .field('name', name)
          .field('parent', parent)
          .attach('file', path.join(__dirname, '../support/fixtures/lorem.txt'))
          .expect(200);

        validateAgainstJSONSchema('POST', endpoint, 200, body);
      });
    });

    describe('when a user uploads a file without name field', () => {
      it('returns a 400', async () => {
        const { site, org, user } = await stubSiteS3({
          roleName: 'manager',
        });
        const fss = await factory.fileStorageService.create({
          siteId: site.id,
          serviceName: site.s3ServiceName,
          org,
        });
        const cookie = await authenticatedSession(user);
        const parent = 'parent/';

        const { body } = await request(app)
          .post(`/v0/file-storage/${fss.id}/upload`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .field('parent', parent)
          .attach('file', path.join(__dirname, '../support/fixtures/lorem.txt'))
          .expect(400);

        validateAgainstJSONSchema('POST', endpoint, 400, body);
      });
    });

    describe('when a user uploads a file without parent field', () => {
      it('returns a 400', async () => {
        const { site, org, user } = await stubSiteS3({
          roleName: 'manager',
        });
        const fss = await factory.fileStorageService.create({
          siteId: site.id,
          serviceName: site.s3ServiceName,
          org,
        });
        const cookie = await authenticatedSession(user);
        const name = 'test.txt';

        const { body } = await request(app)
          .post(`/v0/file-storage/${fss.id}/upload`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .field('name', name)
          .attach('file', path.join(__dirname, '../support/fixtures/lorem.txt'))
          .expect(400);

        validateAgainstJSONSchema('POST', endpoint, 400, body);
      });
    });

    describe('when a user does not upload a file', () => {
      it('returns a 400', async () => {
        const { site, org, user } = await stubSiteS3({
          roleName: 'manager',
        });
        const fss = await factory.fileStorageService.create({
          siteId: site.id,
          serviceName: site.s3ServiceName,
          org,
        });
        const cookie = await authenticatedSession(user);
        const name = 'test.txt';
        const parent = 'parent/';

        const { body } = await request(app)
          .post(`/v0/file-storage/${fss.id}/upload`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .field('name', name)
          .field('parent', parent)
          .expect(400);

        validateAgainstJSONSchema('POST', endpoint, 400, body);
      });
    });
  });
});
