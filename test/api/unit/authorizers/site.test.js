const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const authorizer = require('../../../../api/authorizers/site.js');
const siteErrors = require('../../../../api/responses/siteErrors');
const FederalistUsersHelper = require('../../../../api/services/FederalistUsersHelper');

describe('Site authorizer', () => {
  describe('.create(user, params)', () => {
    beforeEach(() => {
      Promise.all([
        factory.organization.truncate(),
        factory.role.truncate(),
      ]);
    });

    afterEach(() => {
      Promise.all([
        factory.organization.truncate(),
        factory.role.truncate(),
      ]);
    });

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
        factory.role.create(),
      ]);
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
        organizationId: org.id,
      };

      await org.addUser(user, { through: { roleId: role.id } });
      const expected = await authorizer.create(user, params);

      return expect(expected).to.be.undefined;
    });

    // eslint-disable-next-line consistent-return
    it('should throw an error for user with organizations and no organizationId specified', async () => {
      const [user, org, role] = await Promise.all([
        factory.user(),
        factory.organization.create(),
        factory.role.create(),
      ]);
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
      };

      await org.addUser(user, { through: { roleId: role.id } });

      try {
        await authorizer.create(user, params);
      } catch (error) {
        return expect(error.message).to.equal(siteErrors.ORGANIZATION_REQUIRED);
      }
    });

    // eslint-disable-next-line consistent-return
    it('should throw an error for user trying to add a site to an org they do not belong to', async () => {
      const [user, org, role] = await Promise.all([
        factory.user(),
        factory.organization.create(),
        factory.role.create(),
      ]);
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
        organizationId: 'not-their-org',
      };

      await org.addUser(user, { through: { roleId: role.id } });

      try {
        await authorizer.create(user, params);
      } catch (error) {
        expect(error.status).to.equal(404);
        return expect(error.message).to.equal(siteErrors.NO_ASSOCIATED_ORGANIZATION);
      }
    });
  });

  describe('.findOne(user, site)', () => {
    it('should resolve if the user is associated with the site', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: Promise.all([user]) });
      const expected = await authorizer.findOne(user, site);

      return expect(expected).to.equal(site.id);
    });

    // eslint-disable-next-line consistent-return
    it('should reject if the user is not associated with the site', async () => {
      const user = await factory.user();
      const site = await factory.site();

      try {
        await authorizer.findOne(user, site);
      } catch (error) {
        return expect(error).to.equal(403);
      }
    });
  });

  describe('.update(user, site)', () => {
    it('should resolve if the user is associated with the site', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: Promise.all([user]) });
      const expected = await authorizer.update(user, site);

      return expect(expected).to.equal(site.id);
    });

    it('should reject if the user is not associated with the site', async () => {
      const user = await factory.user();
      const site = await factory.site();

      try {
        await authorizer.update(user, site);
      } catch (error) {
        expect(error).to.equal(403);
      }
    });
  });

  describe('.destroy(user, site)', () => {
    let stub;
    beforeEach(() => {
      stub = sinon.stub(FederalistUsersHelper, 'federalistUsersAdmins');
      nock.cleanAll();
    });
    afterEach(() => {
      stub.restore();
      nock.cleanAll();
    });
    it('should resolve if the user is associated with the site', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: Promise.all([user]) });

      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [200, {
          permissions: { admin: true, push: true },
        }],
      });

      const expected = await authorizer.destroy(user, site);
      return expect(expected).to.equal(site.id);
    });

    it('should reject if the user is not associated with the site', async () => {
      const user = await factory.user();
      const site = await factory.site();

      stub.rejects();

      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [200, {
          permissions: { admin: true, push: true },
        }],
      });

      try {
        await authorizer.destroy(user, site);
      } catch (error) {
        expect(error.status).to.equal(403);
      }
    });

    it('should accept if user is not assoc with the site but is feralist-users admin', async () => {
      const user = await factory.user();
      const site = await factory.site();

      stub.resolves([user.username]);
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [200, {
          permissions: { admin: true, push: true },
        }],
      });

      const expected = await authorizer.destroy(user, site);
      return expect(expected).to.be.undefined;
    });

    // eslint-disable-next-line consistent-return
    it('should reject if the user is associated with the site but not an admin', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: Promise.all([user]) });

      stub.rejects();
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [200, {
          permissions: { admin: false, push: true },
        }],
      });

      try {
        await authorizer.destroy(user, site);
      } catch (error) {
        expect(error.status).to.equal(403);
        return expect(error.message).to.equal(siteErrors.ADMIN_ACCESS_REQUIRED);
      }
    });

    it('should accept if the user is associated with the site but site does not exist', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: Promise.all([user]) });

      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [404, {}],
      });

      const expected = await authorizer.destroy(user, site);
      return expect(expected).to.equal(site.id);
    });

    // eslint-disable-next-line consistent-return
    it('should reject if the user is associated with the site but returns error', async () => {
      const user = await factory.user();
      const site = await factory.site({ users: Promise.all([user]) });

      stub.resolves([]);
      githubAPINocks.repo({
        owner: site.owner,
        repository: site.repo,
        response: [400, {}],
      });

      try {
        await authorizer.destroy(user, site);
      } catch (error) {
        expect(error.status).to.equal(403);
        return expect(error.message).to.equal(siteErrors.ADMIN_ACCESS_REQUIRED);
      }
    });
  });
});
