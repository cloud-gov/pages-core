const crypto = require('crypto');
const { expect } = require('chai');
const nock = require('nock');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const authorizer = require('../../../../api/authorizers/site');
const { Role, Site } = require('../../../../api/models');
const siteErrors = require('../../../../api/responses/siteErrors');
const { createSiteUserOrg } = require('../../support/site-user');
const config = require('../../../../config');
const GitLabHelper = require('../../../../api/services/GitLabHelper');
const { getRefreshToken200Response } = require('../../support/gitlabAPINocks');

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
gitlabConfig.clientID = 'mock-client-id';
gitlabConfig.clientSecret = 'mock-client-secret';
gitlabConfig.callbackURL = 'https://localhost:1337/auth/gitlab/callback';
gitlabConfig.baseURL = 'https://workshop.cloud.gov/';

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
      const { user, org } = await createSiteUserOrg();
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
        organizationId: org.id,
      };

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
      const { user } = await createSiteUserOrg();
      const params = {
        owner: crypto.randomBytes(3).toString('hex'),
        repository: crypto.randomBytes(3).toString('hex'),
        defaultBranch: 'main',
        engine: 'jekyll',
      };

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
    it('should reject if the user is not associated with the site', async () => {
      const [user, site] = await Promise.all([factory.user(), factory.site()]);
      const error = await authorizer.findOne(user, site).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(404);
      expect(error.message).to.equal(siteErrors.NOT_FOUND);
    });
    context('site that belongs to an inactive organization', () => {
      it(`should resolve if the site is associated
          with the active organization`, async () => {
        const { site, user } = await createSiteUserOrg();
        const expected = await authorizer.findOne(user, site);

        return expect(expected.id).to.equal(site.id);
      });

      it(`should reject if the site is associated
          with the inactive organization`, async () => {
        const { site, user, org } = await createSiteUserOrg();
        await org.update({ isActive: false });
        const error = await authorizer.findOne(user, site).catch((err) => err);

        expect(error).to.be.throw;
        expect(error.status).to.equal(403);
        expect(error.message).to.equal(siteErrors.ORGANIZATION_INACTIVE);
      });
    });
    context('site is inactive', () => {
      it('should resolve if the site is active', async () => {
        const { site, user } = await createSiteUserOrg();
        const expected = await authorizer.findOne(user, site);
        expect(expected.isActive).to.be.true;
        return expect(expected.id).to.equal(site.id);
      });

      it('should reject if the site is inactive', async () => {
        const { site, user } = await createSiteUserOrg();
        await site.update({ isActive: false });
        const error = await authorizer.findOne(user, site).catch((err) => err);

        expect(error).to.be.throw;
        expect(error.status).to.equal(403);
        expect(error.message).to.equal(siteErrors.ORGANIZATION_INACTIVE);
      });
    });
  });

  describe('.update(user, site)', () => {
    it('should reject if the user is not associated with the site', async () => {
      const [user, site] = await Promise.all([factory.user(), factory.site()]);
      const error = await authorizer.update(user, site).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(404);
      expect(error.message).to.equal(siteErrors.NOT_FOUND);
    });
    context('site that belongs to an inactive organization', () => {
      it(`should resolve if the site is associated
          with the active organization`, async () => {
        const { site, user } = await createSiteUserOrg();
        const expected = await authorizer.update(user, site);

        return expect(expected.id).to.equal(site.id);
      });

      it(`should reject if the site is associated
          with the inactive organization`, async () => {
        const { site, user, org } = await createSiteUserOrg();
        await org.update({ isActive: false });

        const error = await authorizer.update(user, site).catch((err) => err);

        expect(error).to.be.throw;
        expect(error.status).to.equal(403);
        expect(error.message).to.equal(siteErrors.ORGANIZATION_INACTIVE);
      });
    });
    context('site is active', () => {
      it('should resolve if the site is active', async () => {
        const { site, user } = await createSiteUserOrg();
        const expected = await authorizer.update(user, site);
        expect(expected.isActive).to.be.true;

        return expect(expected.id).to.equal(site.id);
      });

      it('should reject if the site is inactive', async () => {
        const { site, user } = await createSiteUserOrg();
        await site.update({ isActive: false });
        const error = await authorizer.update(user, site).catch((err) => err);

        expect(error).to.be.throw;
        expect(error.status).to.equal(403);
        expect(error.message).to.equal(siteErrors.ORGANIZATION_INACTIVE);
      });
    });
  });

  describe('.destroy(user, site) - GitHub site', () => {
    beforeEach(() => {
      nock.cleanAll();
    });
    afterEach(() => {
      nock.cleanAll();
    });
    it('should resolve if the user is associated with the site', async () => {
      const { site, user } = await createSiteUserOrg();

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
      expect(error.status).to.equal(404);
      expect(error.message).to.equal(siteErrors.NOT_FOUND);
    });

    it(`should reject if the user is associated
        with the site but not an admin`, async () => {
      const { site, user } = await createSiteUserOrg();

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
      const { site, user } = await createSiteUserOrg();

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
      const { site, user } = await createSiteUserOrg();

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

  describe('.destroy(user, site) - GitLab site ', () => {
    beforeEach(() => {
      nock.cleanAll();
    });
    afterEach(() => {
      nock.cleanAll();
    });

    it('should resolve if the user is an owner of the project', async () => {
      const { site, user } = await createSiteUserOrg({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const gitlabToken = 'gitlabToken';
      await user.update({ gitlabToken });

      const gitlabUserId = 1234567890;

      const gitlabUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .get('/api/v4/user')
        .reply(200, { id: gitlabUserId });

      const gitlabProjectUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .get(
          // eslint-disable-next-line max-len
          `/api/v4/projects/${site.owner}%2F${site.repository}/members/all/${gitlabUserId}`,
        )
        .reply(200, { access_level: GitLabHelper.GITLAB_ACCESS_LEVEL_OWNER });

      const expected = await authorizer.destroy(user, site);

      expect(gitlabUser.isDone()).to.be.true;
      expect(gitlabProjectUser.isDone()).to.be.true;
      return expect(expected).to.equal(site.id);
    });

    it('should reject if the user is not an owner of the project', async () => {
      const { site, user } = await createSiteUserOrg({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const gitlabToken = 'gitlabToken';
      await user.update({ gitlabToken });

      const gitlabUserId = 1234567890;

      const gitlabUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .get('/api/v4/user')
        .reply(200, { id: gitlabUserId });

      const gitlabProjectUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .get(
          // eslint-disable-next-line max-len
          `/api/v4/projects/${site.owner}%2F${site.repository}/members/all/${gitlabUserId}`,
        )
        .reply(200, { access_level: GitLabHelper.GITLAB_ACCESS_LEVEL_MAINTAINER });

      const error = await authorizer.destroy(user, site).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(403);
      expect(error.message).to.equal(siteErrors.DELETE_SITE_GITLAB_ACCESS_REQUIRED);
      expect(gitlabUser.isDone()).to.be.true;
      expect(gitlabProjectUser.isDone()).to.be.true;
    });

    it("should reject if can not retrieve user's GitLab info", async () => {
      const { site, user } = await createSiteUserOrg({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const gitlabToken = 'gitlabToken',
        gitlabRefreshToken = 'gitlabRefreshToken';
      await user.update({ gitlabToken, gitlabRefreshToken });

      const gitlabUserId = 1234567890;

      const gitlabUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .persist()
        .get('/api/v4/user')
        .reply(401, { message: '401 Unauthorized' });

      const refreshToken = nock(gitlabConfig.baseURL)
        .persist()
        .post('/oauth/token')
        .reply(
          200,
          getRefreshToken200Response({
            access_token: gitlabToken,
            refresh_token: gitlabRefreshToken,
          }),
        );

      const gitlabProjectUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .get(
          // eslint-disable-next-line max-len
          `/api/v4/projects/${site.owner}%2F${site.repository}/members/all/${gitlabUserId}`,
        )
        .reply(200, { access_level: GitLabHelper.GITLAB_ACCESS_LEVEL_MAINTAINER });

      const error = await authorizer.destroy(user, site).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(403);
      expect(error.message).to.equal(siteErrors.CAN_NOT_RETRIEVE_USER_GITLAB_INFORMATION);
      expect(gitlabUser.isDone()).to.be.true;
      expect(refreshToken.isDone()).to.be.true;
      expect(gitlabProjectUser.isDone()).to.be.false;
    });

    it(`should reject if there is a different than 404 error 
           retrieving Gitlab user project info`, async () => {
      const { site, user } = await createSiteUserOrg({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const gitlabToken = 'gitlabToken',
        gitlabRefreshToken = 'gitlabRefreshToken';
      await user.update({ gitlabToken, gitlabRefreshToken });

      const gitlabUserId = 1234567890;

      const gitlabUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .persist()
        .get('/api/v4/user')
        .reply(200, { id: gitlabUserId });

      const refreshToken = nock(gitlabConfig.baseURL)
        .persist()
        .post('/oauth/token')
        .reply(
          200,
          getRefreshToken200Response({
            access_token: gitlabToken,
            refresh_token: gitlabRefreshToken,
          }),
        );

      const gitlabProjectUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .get(
          // eslint-disable-next-line max-len
          `/api/v4/projects/${site.owner}%2F${site.repository}/members/all/${gitlabUserId}`,
        )
        .reply(500, { error: 'some error' });

      const error = await authorizer.destroy(user, site).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(403);
      expect(error.message).to.equal(
        siteErrors.CAN_NOT_RETRIEVE_USER_GITLAB_PROJECT_AUTHORIZATION,
      );
      expect(gitlabUser.isDone()).to.be.true;
      expect(refreshToken.isDone()).to.be.false;
      expect(gitlabProjectUser.isDone()).to.be.true;
    });

    it(`should reject if GitLab project does not exist 
           and user is not authorized to create projects`, async () => {
      const { site, user } = await createSiteUserOrg({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const gitlabToken = 'gitlabToken',
        gitlabRefreshToken = 'gitlabRefreshToken';
      await user.update({ gitlabToken, gitlabRefreshToken });

      const gitlabUserId = 1234567890;

      const gitlabUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .persist()
        .get('/api/v4/user')
        .reply(200, { id: gitlabUserId, can_create_project: false });

      const refreshToken = nock(gitlabConfig.baseURL)
        .persist()
        .post('/oauth/token')
        .reply(
          200,
          getRefreshToken200Response({
            access_token: gitlabToken,
            refresh_token: gitlabRefreshToken,
          }),
        );

      const gitlabProjectUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .get(
          // eslint-disable-next-line max-len
          `/api/v4/projects/${site.owner}%2F${site.repository}/members/all/${gitlabUserId}`,
        )
        .reply(404, { error: 'some error' });

      const error = await authorizer.destroy(user, site).catch((err) => err);

      expect(error).to.be.throw;
      expect(error.status).to.equal(403);
      expect(error.message).to.equal(
        siteErrors.GITLAB_ACCESS_REQUIRED_FOR_DELETED_GITLAB_PROJECT,
      );
      expect(gitlabUser.isDone()).to.be.true;
      expect(refreshToken.isDone()).to.be.false;
      expect(gitlabProjectUser.isDone()).to.be.true;
    });

    it(`should resolve if GitLab project does not exist 
  and user is authorized to create projects`, async () => {
      const { site, user } = await createSiteUserOrg({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const gitlabToken = 'gitlabToken',
        gitlabRefreshToken = 'gitlabRefreshToken';
      await user.update({ gitlabToken, gitlabRefreshToken });

      const gitlabUserId = 1234567890;

      const gitlabUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .persist()
        .get('/api/v4/user')
        .reply(200, { id: gitlabUserId, can_create_project: true });

      const refreshToken = nock(gitlabConfig.baseURL)
        .persist()
        .post('/oauth/token')
        .reply(
          200,
          getRefreshToken200Response({
            access_token: gitlabToken,
            refresh_token: gitlabRefreshToken,
          }),
        );

      const gitlabProjectUser = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .get(
          // eslint-disable-next-line max-len
          `/api/v4/projects/${site.owner}%2F${site.repository}/members/all/${gitlabUserId}`,
        )
        .reply(404, { error: 'some error' });

      const expected = await authorizer.destroy(user, site).catch((err) => err);

      expect(gitlabUser.isDone()).to.be.true;
      expect(refreshToken.isDone()).to.be.false;
      expect(gitlabProjectUser.isDone()).to.be.true;
      return expect(expected).to.equal(site.id);
    });
  });
});
