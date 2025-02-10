const { expect } = require('chai');
const factory = require('../../support/factory');
const authorizer = require('../../../../api/authorizers/file-storage');
const siteErrors = require('../../../../api/responses/siteErrors');
const { createSiteUserOrg } = require('../../support/site-user');

describe('file-storage authorizer', () => {
  beforeEach(() => factory.organization.truncate());
  afterEach(() => factory.organization.truncate());

  describe('.canAdminCreateSiteFileStorage(siteId)', () => {
    it('should pass with a valid site with no file storage service', async () => {
      const { site } = await createSiteUserOrg();

      const { site: expected } = await authorizer.canAdminCreateSiteFileStorage(site.id);
      expect(expected.id).to.be.eq(site.id);
      expect(expected.s3ServiceName).to.be.eq(site.s3ServiceName);
      expect(expected.organizationId).to.be.eq(site.organizationId);
    });

    it('should fail with invalid site', async () => {
      const error = await authorizer
        .canAdminCreateSiteFileStorage(9999999999)
        .catch((e) => e);
      expect(error).to.be.throw;
      expect(error.message).to.be.eq(siteErrors.SITE_DOES_NOT_EXIST);
    });

    it('should fail if site file storage exists', async () => {
      const { site, org } = await createSiteUserOrg();
      await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const error = await authorizer
        .canAdminCreateSiteFileStorage(site.id)
        .catch((e) => e);
      expect(error).to.be.throw;
      expect(error.message).to.be.eq(siteErrors.SITE_FILE_STORAGE_EXISTS);
    });
  });

  describe('.canCreateSiteStorage(userId, siteId)', () => {
    it('should pass with an org manager and no existing site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({
        roleName: 'manager',
      });

      const expected = await authorizer.canCreateSiteStorage(user.id, site.id);
      expect(expected.site.id).to.equal(site.id);
      expect(expected.organization.id).to.equal(org.id);
      expect(expected).to.have.all.keys('site', 'organization');
    });

    it('should pass with org manager, no site storage but org storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      await factory.fileStorageService.create({
        organizationId: org.id,
      });

      const expected = await authorizer.canCreateSiteStorage(user.id, site.id);
      expect(expected.site.id).to.equal(site.id);
      expect(expected.organization.id).to.equal(org.id);
      expect(expected).to.have.all.keys('site', 'organization');
    });

    it('should fail with an org manager and an existing site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const error = await authorizer
        .canCreateSiteStorage(user.id, site.id)
        .catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(403);
      expect(error.message).to.be.equal(siteErrors.SITE_FILE_STORAGE_EXISTS);
    });
  });

  describe('.isFileStorageManager(userId, fssId)', () => {
    it('should pass with an org manager an existing file storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      const fss = await factory.fileStorageService.create({
        org,
        siteId: site.id,
      });

      const expected = await authorizer.isFileStorageManager(user.id, fss.id);
      expect(expected.organization.id).to.equal(org.id);
      expect(expected.fileStorageService.id).to.equal(fss.id);
      expect(expected).to.have.all.keys('organization', 'fileStorageService');
    });

    it('should fail with an org manager and no site storage', async () => {
      const { user } = await createSiteUserOrg({ roleName: 'manager' });

      const error = await authorizer.isFileStorageManager(user.id, 123).catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(404);
      expect(error.message).to.be.equal(siteErrors.NOT_FOUND);
    });

    it('should fail with an org user and site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'user' });
      const fss = await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const error = await authorizer
        .isFileStorageManager(user.id, fss.id)
        .catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(403);
      expect(error.message).to.be.equal(siteErrors.ORGANIZATION_MANAGER_ACCESS);
    });
  });

  describe('.isFileStorageUser(userId, fssId)', () => {
    it('should pass with an org manager an existing file storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      const fss = await factory.fileStorageService.create({
        org,
        siteId: site.id,
      });

      const expected = await authorizer.isFileStorageUser(user.id, fss.id);
      expect(expected.organization.id).to.equal(org.id);
      expect(expected.fileStorageService.id).to.equal(fss.id);
      expect(expected).to.have.all.keys('organization', 'fileStorageService');
    });

    it('should pass with an org user and site storage', async () => {
      const { user, org, site } = await createSiteUserOrg({ roleName: 'user' });
      const fss = await factory.fileStorageService.create({
        org,
        siteId: site.id,
      });

      const expected = await authorizer.isFileStorageUser(user.id, fss.id);
      expect(expected.organization.id).to.equal(org.id);
      expect(expected.fileStorageService.id).to.equal(fss.id);
      expect(expected).to.have.all.keys('organization', 'fileStorageService');
    });

    it('should fail with an org user and site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'user' });
      const fss = await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const error = await authorizer
        .isFileStorageManager(user.id, fss.id)
        .catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(403);
      expect(error.message).to.be.equal(siteErrors.ORGANIZATION_MANAGER_ACCESS);
    });
  });
});
