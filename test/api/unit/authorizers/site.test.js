const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const authorizer = require('../../../../api/authorizers/site');
const { Role } = require('../../../../api/models');
const siteErrors = require('../../../../api/responses/siteErrors');

describe('Site authorizer', () => {
  describe('.create(user, params)', () => {
    beforeEach(() => factory.organization.truncate());

    afterEach(() => factory.organization.truncate());

    it('should resolve', async () => {
      const user = await factory.user();
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
      };

      const expected = await authorizer.create(user, params);
      return expect(expected).to.be.undefined;
    });

    it('should resolve for user with organizations', async () => {
      const [user, org, role] = await Promise.all([
        factory.user(),
        factory.organization.create(),
        Role.findOne({
          where: {
            name: 'user',
          },
        }),
      ]);
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
        organizationId: org.id,
      };

      await org.addUser(user, {
        through: {
          roleId: role.id,
        },
      });
      const expected = await authorizer.create(user, params);

      return expect(expected).to.be.undefined;
    });

    it(`should throw an error for user without organizations
        and organizationId specified`, async () => {
      const user = await factory.user();
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
        organizationId: 1,
      };

      const error = await authorizer.create(user, params).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(404);
      return expect(error.message).to.equal(siteErrors.NO_ASSOCIATED_ORGANIZATION);
    });

    it(`should throw an error for user with organizations
        and no organizationId specified`, async () => {
      const [user, org, role] = await Promise.all([
        factory.user(),
        factory.organization.create(),
        Role.findOne({
          where: {
            name: 'user',
          },
        }),
      ]);
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
      };

      await org.addUser(user, {
        through: {
          roleId: role.id,
        },
      });
      const error = await authorizer.create(user, params).catch((err) => err);

      expect(error).to.be.throw;
      return expect(error.message).to.equal(siteErrors.ORGANIZATION_REQUIRED);
    });

    it(`should throw an error for user trying to add a site
        to an org they do not belong to`, async () => {
      const [user, org, role] = await Promise.all([
        factory.user(),
        factory.organization.create(),
        Role.findOne({
          where: {
            name: 'user',
          },
        }),
      ]);
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
        organizationId: 'not-their-org',
      };

      await org.addUser(user, {
        through: {
          roleId: role.id,
        },
      });
      const error = await authorizer.create(user, params).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(404);
      return expect(error.message).to.equal(siteErrors.NO_ASSOCIATED_ORGANIZATION);
    });
  });

  describe('.findOne(user, site)', () => {
    it('should resolve if the user is associated with the site', async () => {
      const user = await factory.user();
      const site = await factory.site({
        users: Promise.all([user]),
      });
      const expected = await authorizer.findOne(user, site);

      return expect(expected.id).to.equal(site.id);
    });

    it('should reject if the user is not associated with the site', async () => {
      const [user, site] = await Promise.all([factory.user(), factory.site()]);
      const error = await authorizer.findOne(user, site).catch((err) => err);

      expect(error).to.be.throw;
      return expect(error).to.equal(403);
    });
    context('site that belongs to an inactive organization', () => {
      it(`should resolve if the site is associated
          with the active organization`, async () => {
        const org = await factory.organization.create();
        const user = await factory.user();
        const site = await factory.site({
          users: Promise.all([user]),
          organizationId: org.id,
        });
        const expected = await authorizer.findOne(user, site);

        return expect(expected.id).to.equal(site.id);
      });

      it(`should reject if the site is associated
          with the inactive organization`, async () => {
        const org = await factory.organization.create({
          isActive: false,
        });
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site({
            organizationId: org.id,
          }),
        ]);
        const error = await authorizer.findOne(user, site).catch((err) => err);

        expect(error).to.be.throw;
        return expect(error).to.equal(403);
      });
    });
    context('site is inactive', () => {
      it('should resolve if the site is active', async () => {
        const user = await factory.user();
        const site = await factory.site({
          users: Promise.all([user]),
        });
        const expected = await authorizer.findOne(user, site);
        expect(expected.isActive).to.be.true;
        return expect(expected.id).to.equal(site.id);
      });

      it('should reject if the site is inactive', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site({
            isActive: false,
          }),
        ]);
        const error = await authorizer.findOne(user, site).catch((err) => err);

        expect(error).to.be.throw;
        return expect(error).to.equal(403);
      });
    });
  });

  describe('.update(user, site)', () => {
    it('should resolve if the user is associated with the site', async () => {
      const user = await factory.user();
      const site = await factory.site({
        users: Promise.all([user]),
      });
      const expected = await authorizer.update(user, site);

      return expect(expected.id).to.equal(site.id);
    });

    it('should reject if the user is not associated with the site', async () => {
      const [user, site] = await Promise.all([factory.user(), factory.site()]);
      const error = await authorizer.update(user, site).catch((err) => err);

      expect(error).to.be.throw;
      return expect(error).to.equal(403);
    });
    context('site that belongs to an inactive organization', () => {
      it(`should resolve if the site is associated
          with the active organization`, async () => {
        const org = await factory.organization.create();
        const user = await factory.user();
        const site = await factory.site({
          users: Promise.all([user]),
          organizationId: org.id,
        });
        const expected = await authorizer.update(user, site);

        return expect(expected.id).to.equal(site.id);
      });

      it(`should reject if the site is associated
          with the inactive organization`, async () => {
        const org = await factory.organization.create({
          isActive: false,
        });
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site({
            organizationId: org.id,
          }),
        ]);
        const error = await authorizer.update(user, site).catch((err) => err);

        expect(error).to.be.throw;
        return expect(error).to.equal(403);
      });
    });
    context('site is active', () => {
      it('should resolve if the site is active', async () => {
        const user = await factory.user();
        const site = await factory.site({
          users: Promise.all([user]),
        });
        const expected = await authorizer.update(user, site);
        expect(expected.isActive).to.be.true;

        return expect(expected.id).to.equal(site.id);
      });

      it('should reject if the site is inactive', async () => {
        const [user, site] = await Promise.all([
          factory.user(),
          factory.site({
            isActive: false,
          }),
        ]);
        const error = await authorizer.update(user, site).catch((err) => err);

        expect(error).to.be.throw;
        return expect(error).to.equal(403);
      });
    });
  });

  describe('.destroy(user, site)', () => {
    beforeEach(() => {
      nock.cleanAll();
    });
    afterEach(() => {
      nock.cleanAll();
    });
    it('should resolve if the user is associated with the site', async () => {
      const user = await factory.user();
      const site = await factory.site({
        users: Promise.all([user]),
      });

      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [
          200,
          {
            permissions: {
              admin: true,
              push: true,
            },
          },
        ],
      });

      const expected = await authorizer.destroy(user, site);
      return expect(expected).to.equal(site.id);
    });

    it('should reject if the user is not associated with the site', async () => {
      const [user, site] = await Promise.all([factory.user(), factory.site()]);

      const error = await authorizer.destroy(user, site).catch((err) => err);

      expect(error).to.be.throw;
      return expect(error).to.equal(403);
    });

    it(`should reject if the user is associated
        with the site but not an admin`, async () => {
      const user = await factory.user();
      const site = await factory.site({
        users: Promise.all([user]),
      });

      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [
          200,
          {
            permissions: {
              admin: false,
              push: true,
            },
          },
        ],
      });

      const error = await authorizer.destroy(user, site).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(403);
      return expect(error.message).to.equal(siteErrors.ADMIN_ACCESS_REQUIRED);
    });

    it(`should accept if the user is associated
        with the site but site does not exist`, async () => {
      const user = await factory.user();
      const site = await factory.site({
        users: Promise.all([user]),
      });

      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [404, {}],
      });

      const expected = await authorizer.destroy(user, site);
      return expect(expected).to.equal(site.id);
    });

    it(`should reject if the user is associated
        with the site but returns error`, async () => {
      const user = await factory.user();
      const site = await factory.site({
        users: Promise.all([user]),
      });

      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [400, {}],
      });

      const error = await authorizer.destroy(user, site).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(403);
      return expect(error.message).to.equal(siteErrors.ADMIN_ACCESS_REQUIRED);
    });
  });
});
