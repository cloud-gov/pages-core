const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const config = require('../../../../config');
const {
  Site,
  User,
  Organization,
  OrganizationRole,
  Build,
} = require('../../../../api/models');
const factory = require('../../support/factory');
const githubAPINocks = require('../../support/githubAPINocks');
const { createSiteUserOrg } = require('../../support/site-user');
const { buildUrl } = require('../../../../api/utils/build');
const GitHub = require('../../../../api/services/GitHub');
// eslint-disable-next-line max-len
const SourceCodePlatformHelper = require('../../../../api/services/SourceCodePlatformHelper');
const GitLabHelper = require('../../../../api/services/GitLabHelper');
const {
  nockRefreshTokenWithResponse,
  getRefreshToken200Response,
  getNockGetProjectUser,
} = require('../../support/gitlabAPINocks');
const GitLab = require('../../../../api/services/GitLab');

const requestedCommitSha = 'a172b66c31e19d456a448041a5b3c2a70c32d8b7';
const clonedCommitSha = '7b8d23c07a2c3b5a140844a654d91e13c66b271a';

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
gitlabConfig.clientID = 'mock-client-id';
gitlabConfig.clientSecret = 'mock-client-secret';
gitlabConfig.callbackURL = 'https://localhost:1337/auth/gitlab/callback';
gitlabConfig.baseURL = 'https://workshop.cloud.gov';

describe('SourceCodePlatformHelper', () => {
  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  describe('reportBuildStatus(build)', () => {
    context('with a build in the processing state', () => {
      let user;
      let site;
      let build;
      let users;
      let org;

      beforeEach(async () => {
        nock.cleanAll();

        ({ site, user, org } = await createSiteUserOrg());
        build = await factory.build({
          state: 'processing',
          site,
          user,
          requestedCommitSha,
        });

        const fullOrg = await Organization.findOne({
          where: { id: org.id },
          include: { model: OrganizationRole, include: User },
        });
        users = fullOrg.OrganizationRoles.map((role) => role.User);
      });
      it("should report that the status is 'pending'", async () => {
        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          repository: site.repository,
          sha: requestedCommitSha,
          state: 'pending',
        });
        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);

        expect(repoNock.isDone()).to.be.true;
        expect(statusNock.isDone()).to.be.true;
      });

      it(`should report the status if
          the build user does not have permission'`, async () => {
        const repoNocks = [];
        build = await factory.build({
          state: 'processing',
          site,
          requestedCommitSha,
        });

        let i;
        let options;
        for (i = 0; i < users.length; i += 1) {
          options = {
            accessToken: users[i].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            username: users[i].username,
          };
          if (users[i].id === build.user) {
            options.response = [
              201,
              {
                permissions: {},
              },
            ];
          }
          repoNocks.push(githubAPINocks.repo(options));
        }

        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          repository: site.repository,
          sha: requestedCommitSha,
          state: 'pending',
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
        expect(statusNock.isDone()).to.be.true;
      });

      it(`should report the status if
          the build initiated by an non-authed user`, async () => {
        const repoNocks = [];
        const newUser = await factory.user({
          githubAccessToken: null,
        });
        await build.update({
          user: newUser.id,
          username: newUser.username,
        });

        let i;
        let options;
        for (i = 0; i < users.length; i += 1) {
          options = {
            accessToken: users[i].githubAccessToken,
            owner: site.owner,
            repo: site.repository,
            username: users[i].username,
          };
          repoNocks.push(githubAPINocks.repo(options));
        }

        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          repository: site.repository,
          sha: requestedCommitSha,
          state: 'pending',
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
        expect(statusNock.isDone()).to.be.true;
      });

      it(`should report the status
          if the build user has invalid token'`, async () => {
        const repoNocks = [];
        await user.update({
          signedInAt: '1999-01-01',
        });
        const otherUser = await factory.user();
        await org.addRoleUser(otherUser);

        repoNocks.push(
          githubAPINocks.repo({
            owner: site.owner,
            repo: site.repository,
            username: user.username,
            response: [
              403,
              {
                permissions: {},
              },
            ],
          }),
        );
        repoNocks.push(
          githubAPINocks.repo({
            owner: site.owner,
            repo: site.repository,
            username: otherUser.username,
          }),
        );

        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          repository: site.repository,
          sha: requestedCommitSha,
          state: 'pending',
        });
        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
        expect(statusNock.isDone()).to.be.true;
      });

      it(`should report that the status if the
          build user does not have write permissions'`, async () => {
        const repoNocks = [];
        await user.update({
          signedInAt: '1999-01-01',
        });
        const otherUser = await factory.user();
        await org.addRoleUser(otherUser);

        repoNocks.push(
          githubAPINocks.repo({
            owner: site.owner,
            repo: site.repository,
            username: user.username,
            response: [
              201,
              {
                permissions: {},
              },
            ],
          }),
        );
        repoNocks.push(
          githubAPINocks.repo({
            owner: site.owner,
            repo: site.repository,
            username: otherUser.username,
          }),
        );

        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          repository: site.repository,
          sha: requestedCommitSha,
          state: 'pending',
        });
        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
        expect(statusNock.isDone()).to.be.true;
      });

      it(`should not report the status
          if the build user has invalid token'`, async () => {
        const repoNocks = [];
        const statusSpy = sinon.spy(GitHub, 'sendCreateGithubStatusRequest');
        const recentUser = await factory.user();
        await org.addRoleUser(recentUser);

        repoNocks.push(
          githubAPINocks.repo({
            owner: site.owner,
            repo: site.repository,
            username: user.username,
            response: [
              403,
              {
                permissions: {},
              },
            ],
          }),
        );
        repoNocks.push(
          githubAPINocks.repo({
            owner: site.owner,
            repo: site.repository,
            username: recentUser.username,
            response: [
              403,
              {
                permissions: {},
              },
            ],
          }),
        );

        await build.reload({ include: Site });
        const err = await SourceCodePlatformHelper.reportBuildStatus(build).catch(
          (e) => e,
        );
        repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
        expect(statusSpy.called).to.be.false;
        expect(err.message).to.equal(
          // eslint-disable-next-line max-len
          `Unable to find a user with valid access token to report build@id=${build.id} status`,
        );
      });

      it(`should not report the status if
          the build user does not have write permissions'`, async () => {
        const repoNocks = [];
        const statusSpy = sinon.spy(GitHub, 'sendCreateGithubStatusRequest');
        const recentUser = await factory.user();
        await org.addRoleUser(recentUser);

        repoNocks.push(
          githubAPINocks.repo({
            owner: site.owner,
            repo: site.repository,
            username: user.username,
            response: [
              201,
              {
                permissions: {},
              },
            ],
          }),
        );
        repoNocks.push(
          githubAPINocks.repo({
            owner: site.owner,
            repo: site.repository,
            username: recentUser.username,
            response: [
              201,
              {
                permissions: {},
              },
            ],
          }),
        );

        await build.reload({ include: Site });
        const err = await SourceCodePlatformHelper.reportBuildStatus(build).catch(
          (e) => e,
        );
        repoNocks.forEach((repoNock) => expect(repoNock.isDone()).to.be.true);
        expect(statusSpy.called).to.be.false;
        expect(err.message).to.equal(
          // eslint-disable-next-line max-len
          `Unable to find a user with valid access token to report build@id=${build.id} status`,
        );
      });

      it('should set the target uri to the build logs', async () => {
        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          sha: requestedCommitSha,
          targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
        });
        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(repoNock.isDone()).to.be.true;
        expect(statusNock.isDone()).to.be.true;
      });

      it('should throw an error if there is no build user', async () => {
        const sendCommitStateStub = sinon.stub(GitLab, 'sendCommitState').returns({
          ok: false,
          json: () => {},
          status: 'responseStatus',
        });

        await expect(
          SourceCodePlatformHelper.reportBuildStatus({
            clonedCommitSha: '11111',
            requestedCommitSha: '11111',
            isInProgress: () => true,
            Site: {
              owner: 'owner',
              repo: 'repository',
              sourceCodePlatform: Site.Platforms.Workshop,
            },
          }),
        ).to.be.rejectedWith(/Failed to send commit state */);

        expect(sendCommitStateStub.calledOnce).to.be.true;
      });
    });

    context('with a build in the created state', () => {
      let user;
      let site;
      let build;

      beforeEach(async () => {
        site = await factory.site({
          owner: 'test-owner',
          repository: 'test-repo',
        });
        ({ user } = await createSiteUserOrg({ site }));
        build = await factory.build({
          state: 'created',
          site,
          requestedCommitSha,
          user,
        });
      });

      it("should report that the status is 'pending'", async () => {
        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: 'test-owner',
          repo: 'test-repo',
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: 'test-owner',
          repo: 'test-repo',
          repository: 'test-repo',
          sha: requestedCommitSha,
          state: 'pending',
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(repoNock.isDone()).to.be.true;
        expect(statusNock.isDone()).to.be.true;
      });

      it('should set the target uri to the build logs', async () => {
        const repoNock = githubAPINocks.repo({
          accessToken: 'fake-access-token',
          owner: 'test-owner',
          repo: 'test-repo',
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: 'test-owner',
          repo: 'test-repo',
          sha: requestedCommitSha,
          targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(repoNock.isDone()).to.be.true;
        expect(statusNock.isDone()).to.be.true;
      });
    });

    context('with a build in the queued state', () => {
      let user;
      let site;
      let build;

      beforeEach(async () => {
        site = await factory.site({
          owner: 'test-owner',
          repository: 'test-repo',
        });
        ({ user } = await createSiteUserOrg({ site }));

        build = await factory.build({
          state: 'created',
          site,
          requestedCommitSha,
          user,
        });
      });
      it("should report that the status is 'pending'", async () => {
        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: 'test-owner',
          repo: 'test-repo',
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: 'test-owner',
          repo: 'test-repo',
          repository: 'test-repo',
          sha: requestedCommitSha,
          state: 'pending',
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(repoNock.isDone()).to.be.true;
        expect(statusNock.isDone()).to.be.true;
      });

      it('should set the target uri to the build logs', async () => {
        const repoNock = githubAPINocks.repo({
          accessToken: 'fake-access-token',
          owner: 'test-owner',
          repo: 'test-repo',
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: 'test-owner',
          repo: 'test-repo',
          sha: requestedCommitSha,
          targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(repoNock.isDone()).to.be.true;
        expect(statusNock.isDone()).to.be.true;
      });
    });

    context('with every build', () => {
      const origAppEnv = config.app.appEnv;
      let user;
      let site;
      let build;

      after(() => {
        // reset config.app.appEnv to its original value
        config.app.appEnv = origAppEnv;
      });

      beforeEach(async () => {
        site = await factory.site({
          owner: 'test-owner',
          repository: 'test-repo',
        });
        ({ user } = await createSiteUserOrg({ site }));
        build = await factory.build({
          state: 'success',
          site,
          requestedCommitSha,
          clonedCommitSha,
          user,
        });
      });

      it(`should set status context to
          "federalist/build" when APP_ENV is "production"`, async () => {
        config.app.appEnv = 'production';
        const repoNock = githubAPINocks.repo({
          accessToken: 'fake-access-token',
          owner: 'test-owner',
          repo: 'test-repo',
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: 'test-owner',
          repo: 'test-repo',
          sha: clonedCommitSha,
          state: 'success',
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(repoNock.isDone()).to.be.true;
        expect(statusNock.isDone()).to.be.true;
      });
    });

    context('with a build in the success state', () => {
      let user;
      let site;
      let build;

      beforeEach(async () => {
        user = await factory.user();
        ({ site, user } = await createSiteUserOrg());
        build = await factory.build({
          state: 'success',
          requestedCommitSha,
          clonedCommitSha,
          user,
          site,
        });
      });
      it("should report that the status is 'success'", async () => {
        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          sha: clonedCommitSha,
          state: 'success',
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(repoNock.isDone()).to.be.true;
        expect(statusNock.isDone()).to.be.true;
      });

      it('should set the target uri to the preview link', async () => {
        await build.update({
          branch: 'preview-branch',
        });

        await build.reload();

        // this depends on branch so we update twice
        await build.update({
          url: buildUrl(build, site),
        });

        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          sha: clonedCommitSha,
          targetURL: buildUrl(build, site),
        });

        await build.reload({ include: Site });

        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(repoNock.isDone()).to.be.true;
        expect(statusNock.isDone()).to.be.true;
      });
    });

    context('with a build in the error state', () => {
      let user;
      let site;
      let build;

      beforeEach(async () => {
        ({ site, user } = await createSiteUserOrg());
        build = await factory.build({
          state: 'error',
          requestedCommitSha,
          user,
          site,
        });
      });
      it("should report that the status is 'error' with requestedCommitSha", async () => {
        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          sha: requestedCommitSha,
          state: 'error',
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(statusNock.isDone()).to.be.true;
        expect(repoNock.isDone()).to.be.true;
      });

      it("should report that the status is 'error' with clonedCommitSha", async () => {
        await build.update({
          clonedCommitSha,
        });

        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          sha: clonedCommitSha,
          state: 'error',
          targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(statusNock.isDone()).to.be.true;
        expect(repoNock.isDone()).to.be.true;
      });

      it(`should use the GitHub
          access token of the build's user not a site user`, async () => {
        const nonSiteUser = await factory.user();
        await build.update({
          user: nonSiteUser.id,
        });

        const repoNock = githubAPINocks.repo({
          accessToken: nonSiteUser.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          sha: requestedCommitSha,
          state: 'error',
          targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);

        expect(statusNock.isDone()).to.be.true;
        expect(repoNock.isDone()).to.be.true;
      });
    });

    context('with a build in the invalid state', () => {
      let user;
      let site;
      let build;

      beforeEach(async () => {
        ({ site, user } = await createSiteUserOrg());
        build = await factory.build({
          state: 'invalid',
          requestedCommitSha,
          user,
          site,
        });
      });
      it("should report that the status is 'error' with requestedCommitSha", async () => {
        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          sha: requestedCommitSha,
          state: 'error',
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(statusNock.isDone()).to.be.true;
        expect(repoNock.isDone()).to.be.true;
      });

      it("should report that the status is 'error' with clonedCommitSha", async () => {
        await build.update({
          clonedCommitSha,
        });

        const repoNock = githubAPINocks.repo({
          accessToken: user.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          sha: clonedCommitSha,
          state: 'error',
          targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);
        expect(statusNock.isDone()).to.be.true;
        expect(repoNock.isDone()).to.be.true;
      });

      it(`should use the GitHub
          access token of the build's user not a site user`, async () => {
        const nonSiteUser = await factory.user();
        await build.update({
          user: nonSiteUser.id,
        });

        const repoNock = githubAPINocks.repo({
          accessToken: nonSiteUser.githubAccessToken,
          owner: site.owner,
          repo: site.repository,
          username: user.username,
        });
        const statusNock = githubAPINocks.status({
          owner: site.owner,
          repo: site.repository,
          sha: requestedCommitSha,
          state: 'error',
          targetURL: `${config.app.hostname}/sites/${build.site}/builds/${build.id}/logs`,
        });

        await build.reload({ include: Site });
        await SourceCodePlatformHelper.reportBuildStatus(build);

        expect(statusNock.isDone()).to.be.true;
        expect(repoNock.isDone()).to.be.true;
      });
    });
  });

  describe('refreshUserGitLabTokenIfNeeded(user, sourceCodePlatform, flow)', () => {
    before(async () => {
      sinon.restore();
    });

    it(`should not call GitLabHelper.refreshUserGitLabTokenIfNeeded() 
             for GitHub site`, async () => {
      /* eslint-disable no-await-in-loop */
      for (const flow of Object.values(SourceCodePlatformHelper.flows)) {
        sinon.restore();
        const gitlabHelperStub = sinon.stub(
          GitLabHelper,
          'refreshUserGitLabTokenIfNeeded',
        );

        await SourceCodePlatformHelper.refreshUserGitLabTokenIfNeeded(
          {},
          Site.Platforms.Github,
          flow,
        );
        expect(gitlabHelperStub.called).to.be.false;
      }
      /* eslint-enable no-await-in-loop */
    });

    it(`should call GitLabHelper.refreshUserGitLabTokenIfNeeded() 
             only for specified flows`, async () => {
      async function testFlow(flow, expected) {
        sinon.restore();
        const gitlabHelperStub = sinon.stub(
          GitLabHelper,
          'refreshUserGitLabTokenIfNeeded',
        );
        await SourceCodePlatformHelper.refreshUserGitLabTokenIfNeeded(
          {},
          Site.Platforms.Workshop,
          flow,
        );
        expect(gitlabHelperStub.called).to.equal(expected);
      }

      /* eslint-disable no-await-in-loop */
      for (const flow of Object.values(SourceCodePlatformHelper.flows)) {
        await testFlow(flow, flow.refresh);
      }
      /* eslint-enable no-await-in-loop */

      await testFlow(SourceCodePlatformHelper.flows.FLOW____CREATE_SITE, true);
      await testFlow(SourceCodePlatformHelper.flows.FLOW_NEW_SITE_BUILD, false);
      await testFlow(SourceCodePlatformHelper.flows.FLOW___CORE_REBUILD, true);
      await testFlow(SourceCodePlatformHelper.flows.FLOW__ADMIN_REBUILD, true);
      await testFlow(SourceCodePlatformHelper.flows.FLOW___BUILD_STATUS, false);
      await testFlow(SourceCodePlatformHelper.flows.FLOW__WEBHOOK_BUILD, true);
      await testFlow(SourceCodePlatformHelper.flows.FLOW___DESTROY_SITE, true);
      await testFlow(SourceCodePlatformHelper.flows.FLOW___EDITOR_BUILD, true);
      await testFlow(SourceCodePlatformHelper.flows.FLOW_____SBC_CREATE, true);
      await testFlow(SourceCodePlatformHelper.flows.FLOW_____SBC_UPDATE, true);
      await testFlow(SourceCodePlatformHelper.flows.FLOW__DOMAIN_DEPROV, true);
      await testFlow(SourceCodePlatformHelper.flows.FLOW__NIGHTLY_BUILD, true);
    });
  });

  describe('ensureBuildUserWithFreshGitLabToken(build, flow, now)', () => {
    beforeEach(async () => {
      sinon.restore();
    });

    afterEach(async () => {
      sinon.restore();
      nock.cleanAll();

      return Promise.all([
        Site.truncate({
          force: true,
          cascade: true,
        }),
        Build.truncate({
          force: true,
          cascade: true,
        }),
        User.truncate({
          force: true,
          cascade: true,
        }),
      ]);
    });

    it(`should call GitLabHelper.refreshUserGitLabTokenIfNeeded() for build with user, 
             gitlabToken and flow with refresh flag`, async () => {
      let user = await factory.user({
        username: 'user',
        gitlabToken: 'old-gitlab-token',
      });
      user = await user.update({
        username: 'user',
        gitlabToken: 'old-gitlab-token',
        gitlabUserId: '1111',
      });
      let site = await factory.site();
      site = await site.update({ sourceCodePlatform: Site.Platforms.Workshop });
      const build = await factory.build({ site, user });
      const flow = SourceCodePlatformHelper.flows.FLOW____CREATE_SITE;

      const hasPermissionsStub = sinon
        .stub(GitLabHelper, 'getProjectPermissions')
        .returns({ push: true });

      const refreshUserGitLabTokenIfNeededStub = sinon.stub(
        GitLabHelper,
        'refreshUserGitLabTokenIfNeeded',
      );

      const now = Date.now();
      await SourceCodePlatformHelper.ensureBuildUserWithFreshGitLabToken(
        build,
        flow,
        now,
      );

      sinon.assert.calledOnce(hasPermissionsStub);
      sinon.assert.calledOnceWithMatch(
        refreshUserGitLabTokenIfNeededStub,
        sinon.match({
          id: user.id,
        }),
        now,
        flow.description,
      );
    });

    async function initTestModel(gitlabExpiresAtArray, originalBuildUser) {
      const userConfig1 = {
        gitlabToken: 'old-gitlab-token-1',
        gitlabExpiresAt: gitlabExpiresAtArray[0],
        gitlabUserId: 11,
        username: 'user1-Expires-Last',
      };
      const userConfig2 = {
        gitlabToken: 'old-gitlab-token-2',
        gitlabExpiresAt: gitlabExpiresAtArray[1],
        gitlabUserId: 22,
        username: 'user2',
      };
      const userConfig3 = {
        gitlabToken: 'old-gitlab-token-3',
        gitlabExpiresAt: gitlabExpiresAtArray[2],
        gitlabUserId: 33,
        username: 'user3-Expires-First',
      };

      let user1 = await factory.user(userConfig1);
      user1 = await user1.update(userConfig1);
      let user2 = await factory.user(userConfig2);
      user2 = await user2.update(userConfig2);
      let user3 = await factory.user(userConfig3);
      user3 = await user3.update(userConfig3);

      const org = await factory.organization.create();
      let site = await factory.site({
        organizationId: org.id,
      });

      const sourceCodeUrl = 'https://workshop.cloud.gov/cloud-gov/pages';
      site = await site.update({
        sourceCodePlatform: Site.Platforms.Workshop,
        sourceCodeUrl,
      });
      const build = originalBuildUser
        ? await factory.build({ site, user: originalBuildUser })
        : await factory.build({ site });

      if (originalBuildUser) {
        await org.addRoleUser(originalBuildUser, 'manager');
      }
      await org.addRoleUser(user1, 'manager');
      await org.addRoleUser(user2, 'manager');
      await org.addRoleUser(user3, 'manager');
      return { user1, user2, user3, sourceCodeUrl, build };
    }

    function initNockGetProjectUserInvalidGrant(user1, sourceCodeUrl, user2, user3) {
      const nockGetProjectUser1InvalidGrant = getNockGetProjectUser(
        user1.gitlabToken,
        user1.gitlabUserId,
        sourceCodeUrl,
        401,
        10,
      );
      const nockGetProjectUser2InvalidGrant = getNockGetProjectUser(
        user2.gitlabToken,
        user2.gitlabUserId,
        sourceCodeUrl,
        401,
        20,
      );
      const nockGetProjectUser3InvalidGrant = getNockGetProjectUser(
        user3.gitlabToken,
        user3.gitlabUserId,
        sourceCodeUrl,
        401,
        40,
      );
      return {
        nockGetProjectUser1InvalidGrant,
        nockGetProjectUser2InvalidGrant,
        nockGetProjectUser3InvalidGrant,
      };
    }

    function initNockRefresh(
      user1,
      user1NewAccessToken,
      user2,
      user2NewAccessToken,
      user3,
      user3NewAccessToken,
    ) {
      const refreshNock1 = nockRefreshTokenWithResponse(
        gitlabConfig,
        user1.gitlabToken,
        user1.gitlabRefreshToken,
        200,
        getRefreshToken200Response({
          access_token: user1NewAccessToken,
          expires_in: 7200,
          refresh_token: 'user1-new-refresh-token',
          created_at: Date.now(),
        }),
      );
      const refreshNock2 = nockRefreshTokenWithResponse(
        gitlabConfig,
        user2.gitlabToken,
        user2.gitlabRefreshToken,
        200,
        getRefreshToken200Response({
          access_token: user2NewAccessToken,
          expires_in: 7200,
          refresh_token: 'user2-new-refresh-token',
          created_at: Date.now(),
        }),
      );
      const refreshNock3 = nockRefreshTokenWithResponse(
        gitlabConfig,
        user3.gitlabToken,
        user3.gitlabRefreshToken,
        200,
        getRefreshToken200Response({
          access_token: user3NewAccessToken,
          expires_in: 7200,
          refresh_token: 'user3-new-refresh-token',
          created_at: Date.now(),
        }),
      );
      return { refreshNock1, refreshNock2, refreshNock3 };
    }

    function nockGetProjectUserSuccess(
      user1NewAccessToken,
      user1,
      sourceCodeUrl,
      user2NewAccessToken,
      user2,
      user3NewAccessToken,
      user3,
    ) {
      const nockGetProjectUser1 = getNockGetProjectUser(
        user1NewAccessToken,
        user1.gitlabUserId,
        sourceCodeUrl,
        200,
        10,
      );
      const nockGetProjectUser2 = getNockGetProjectUser(
        user2NewAccessToken,
        user2.gitlabUserId,
        sourceCodeUrl,
        200,
        20,
      );
      const nockGetProjectUser3 = getNockGetProjectUser(
        user3NewAccessToken,
        user3.gitlabUserId,
        sourceCodeUrl,
        200,
        40,
      );
      return { nockGetProjectUser1, nockGetProjectUser2, nockGetProjectUser3 };
    }

    async function tester(originalBuildUser, now, gitlabExpiresAtArray) {
      let { user1, user2, user3, sourceCodeUrl, build } = await initTestModel(
        gitlabExpiresAtArray,
        originalBuildUser,
      );
      const {
        nockGetProjectUser1InvalidGrant,
        nockGetProjectUser2InvalidGrant,
        nockGetProjectUser3InvalidGrant,
      } = initNockGetProjectUserInvalidGrant(user1, sourceCodeUrl, user2, user3);

      const user1NewAccessToken = 'user-1-new-access-token';
      const user2NewAccessToken = 'user-2-new-access-token';
      const user3NewAccessToken = 'user-3-new-access-token';
      const { refreshNock1, refreshNock2, refreshNock3 } = initNockRefresh(
        user1,
        user1NewAccessToken,
        user2,
        user2NewAccessToken,
        user3,
        user3NewAccessToken,
      );
      const { nockGetProjectUser1, nockGetProjectUser2, nockGetProjectUser3 } =
        nockGetProjectUserSuccess(
          user1NewAccessToken,
          user1,
          sourceCodeUrl,
          user2NewAccessToken,
          user2,
          user3NewAccessToken,
          user3,
        );

      await SourceCodePlatformHelper.ensureBuildUserWithFreshGitLabToken(
        build,
        SourceCodePlatformHelper.flows.FLOW____CREATE_SITE,
      );

      expect(refreshNock1.isDone()).to.equal(true);
      expect(refreshNock2.isDone()).to.equal(true);
      expect(refreshNock3.isDone()).to.equal(true);

      expect(nockGetProjectUser1InvalidGrant.isDone()).to.equal(true);
      expect(nockGetProjectUser2InvalidGrant.isDone()).to.equal(true);
      expect(nockGetProjectUser3InvalidGrant.isDone()).to.equal(true);

      expect(nockGetProjectUser1.isDone()).to.equal(true);
      expect(nockGetProjectUser2.isDone()).to.equal(true);
      expect(nockGetProjectUser3.isDone()).to.equal(true);

      await user1.reload();
      await user2.reload();
      await user3.reload();

      await build.reload({ include: [Site, User] });
      const newBuildUser = build.User;

      expect(user1.gitlabToken).to.equal(user1NewAccessToken);
      expect(user2.gitlabToken).to.equal(user2NewAccessToken);
      expect(user3.gitlabToken).to.equal(user3NewAccessToken);

      expect(newBuildUser.username).to.equal('user3-expires-first');
      expect(newBuildUser.gitlabToken).to.equal(user3NewAccessToken);
    }

    it(`should load new build user if build does not have user 
             all 3 users require token refresh`, async () => {
      let userWithoutToken = await factory.user();
      const now = Date.now();
      await tester(userWithoutToken, now, [
        new Date(now + 1),
        new Date(now),
        new Date(now - 1),
      ]);
    });

    it(`should load new build user if build user does not have gitlabToken 
             and all 3 users require token refresh`, async () => {
      const now = Date.now();
      await tester(null, now, [new Date(now + 1), new Date(now), new Date(now - 1)]);
    });

    it(`should load new build user if build user does not have gitlabToken, 
             none of 3 users require token refresh, 
             and token refreshed proactively for the selected build user`, async () => {
      let userWithoutToken = await factory.user();
      const now = Date.now();

      let { user1, user2, user3, sourceCodeUrl, build } = await initTestModel(
        [
          new Date(now + GitLabHelper.TOKEN_PROACTIVE_REFRESH_MS - 1),
          new Date(now + GitLabHelper.TOKEN_PROACTIVE_REFRESH_MS - 1),
          new Date(now + GitLabHelper.TOKEN_PROACTIVE_REFRESH_MS - 1),
        ],
        userWithoutToken,
      );

      const { nockGetProjectUser1, nockGetProjectUser2, nockGetProjectUser3 } =
        nockGetProjectUserSuccess(
          user1.gitlabToken,
          user1,
          sourceCodeUrl,
          user2.gitlabToken,
          user2,
          user3.gitlabToken,
          user3,
        );

      const user3NewAccessToken = 'user-3-new-access-token';
      const refreshNockForSelectedBuildUser = nockRefreshTokenWithResponse(
        gitlabConfig,
        user3.gitlabToken,
        user3.gitlabRefreshToken,
        200,
        getRefreshToken200Response({
          access_token: user3NewAccessToken,
          expires_in: 7200,
          refresh_token: 'user3-new-refresh-token',
          created_at: Date.now(),
        }),
      );

      await SourceCodePlatformHelper.ensureBuildUserWithFreshGitLabToken(
        build,
        SourceCodePlatformHelper.flows.FLOW____CREATE_SITE,
      );

      expect(nockGetProjectUser1.isDone()).to.equal(true);
      expect(nockGetProjectUser2.isDone()).to.equal(true);
      expect(nockGetProjectUser3.isDone()).to.equal(true);

      expect(refreshNockForSelectedBuildUser.isDone()).to.equal(true);

      await user1.reload();
      await user2.reload();
      await user3.reload();

      await build.reload({ include: [Site, User] });
      const newBuildUser = build.User;

      expect(user1.gitlabToken).to.equal('old-gitlab-token-1');
      expect(user2.gitlabToken).to.equal('old-gitlab-token-2');
      expect(user3.gitlabToken).to.equal(user3NewAccessToken);

      expect(newBuildUser.username).to.equal(user3.username);
      expect(newBuildUser.gitlabToken).to.equal(user3NewAccessToken);
    });

    it(`should load new build user if build user does not have gitlabToken, 
             none of 3 users require token refresh, 
             and token is not refreshed proactively 
             for the selected build user`, async () => {
      let userWithoutToken = await factory.user();
      const now = Date.now();

      let { user1, user2, user3, sourceCodeUrl, build } = await initTestModel(
        [
          new Date(now + 2 * GitLabHelper.TOKEN_PROACTIVE_REFRESH_MS),
          new Date(now + 2 * GitLabHelper.TOKEN_PROACTIVE_REFRESH_MS),
          new Date(now + 2 * GitLabHelper.TOKEN_PROACTIVE_REFRESH_MS),
        ],
        userWithoutToken,
      );

      const { nockGetProjectUser1, nockGetProjectUser2, nockGetProjectUser3 } =
        nockGetProjectUserSuccess(
          user1.gitlabToken,
          user1,
          sourceCodeUrl,
          user2.gitlabToken,
          user2,
          user3.gitlabToken,
          user3,
        );

      const user3NewAccessToken = 'user-3-new-access-token';
      const refreshNockForSelectedBuildUser = nockRefreshTokenWithResponse(
        gitlabConfig,
        user3.gitlabToken,
        user3.gitlabRefreshToken,
        200,
        getRefreshToken200Response({
          access_token: user3NewAccessToken,
          expires_in: 7200,
          refresh_token: 'user3-new-refresh-token',
          created_at: Date.now(),
        }),
      );

      await SourceCodePlatformHelper.ensureBuildUserWithFreshGitLabToken(
        build,
        SourceCodePlatformHelper.flows.FLOW____CREATE_SITE,
      );

      expect(nockGetProjectUser1.isDone()).to.equal(true);
      expect(nockGetProjectUser2.isDone()).to.equal(true);
      expect(nockGetProjectUser3.isDone()).to.equal(true);

      expect(refreshNockForSelectedBuildUser.isDone()).to.equal(false);

      await user1.reload();
      await user2.reload();
      await user3.reload();

      await build.reload({ include: [Site, User] });
      const newBuildUser = build.User;

      expect(user1.gitlabToken).to.equal('old-gitlab-token-1');
      expect(user2.gitlabToken).to.equal('old-gitlab-token-2');
      expect(user3.gitlabToken).to.equal('old-gitlab-token-3');

      expect(newBuildUser.username).to.equal(user3.username);
      expect(newBuildUser.gitlabToken).to.equal('old-gitlab-token-3');
    });
  });

  describe('getTokenForSiteBuildQueue(build)', () => {
    before(async () => {
      sinon.restore();
    });

    it(`should return build user GitLab token for GitLab site`, async () => {
      const userConfig = {
        gitlabToken: 'gitlab-token',
        githubAccessToken: 'github-token',
      };

      let user = await factory.user(userConfig);
      user = await user.update(userConfig);

      let site = await factory.site();
      await site.update({
        sourceCodePlatform: Site.Platforms.Workshop,
      });
      const build = await factory.build({ site, user });
      await build.reload({ include: [Site, User] });

      expect(await SourceCodePlatformHelper.getTokenForSiteBuildQueue(build)).to.equal(
        'oauth2:gitlab-token',
      );
    });

    it(`should return build user GitHub token for GitHub site`, async () => {
      const userConfig = {
        gitlabToken: 'gitlab-token',
        githubAccessToken: 'github-token',
      };

      let user = await factory.user(userConfig);
      user = await user.update(userConfig);

      let site = await factory.site();
      await site.update({
        sourceCodePlatform: Site.Platforms.GitHub,
      });
      const build = await factory.build({ site, user });
      await build.reload({ include: [Site, User] });
      await build.reload({ include: [Site, User] });

      expect(await SourceCodePlatformHelper.getTokenForSiteBuildQueue(build)).to.equal(
        'github-token',
      );
    });

    it(`should throw an error if can not load a token `, async () => {
      const userConfig = {
        gitlabToken: null,
        githubAccessToken: 'github-token',
      };

      let user = await factory.user(userConfig);
      user = await user.update(userConfig);

      const org = await factory.organization.create();
      let site = await factory.site({
        organizationId: org.id,
      });

      site = await site.update({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const build = await factory.build({ site, user });
      await build.reload({ include: [Site, User] });

      const error = await SourceCodePlatformHelper.getTokenForSiteBuildQueue(build).catch(
        (e) => e,
      );

      expect(
        error.message.startsWith(
          'Unable to find a user with valid access token to report build@id',
        ),
      ).to.be.equal(true);
    });
  });

  describe('getLastSuccessfulBuildUserWithPermissions(build)', () => {
    beforeEach(async () => {
      sinon.restore();
    });

    afterEach(async () => {
      sinon.restore();
      nock.cleanAll();

      return Promise.all([
        Site.truncate({
          force: true,
          cascade: true,
        }),
        Build.truncate({
          force: true,
          cascade: true,
        }),
        User.truncate({
          force: true,
          cascade: true,
        }),
      ]);
    });

    it(`should find a user from last successful site build`, async () => {
      const userConfig1 = {
        gitlabToken: 'gitlab-token',
        id: 1,
      };

      const userConfig2 = {
        gitlabToken: 'gitlab-token',
        id: 2,
      };

      const userConfig3 = {
        gitlabToken: 'gitlab-token',
        id: 3,
      };

      const userConfig4 = {
        gitlabToken: 'gitlab-token',
        id: 4,
      };

      let user1 = await factory.user(userConfig1);
      user1 = await user1.update(userConfig1);

      let user2 = await factory.user(userConfig2);
      user2 = await user2.update(userConfig2);

      let user3 = await factory.user(userConfig3);
      user3 = await user3.update(userConfig3);

      let user4 = await factory.user(userConfig4);
      user4 = await user4.update(userConfig4);

      let site = await factory.site();
      await site.update({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      let site2 = await factory.site();
      await site2.update({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const build1 = await factory.build({
        site,
        user: user1,
        state: 'created',
        createdAt: new Date(),
      });
      await build1.reload({ include: [Site, User] });

      const build2 = await factory.build({
        site,
        user: user2,
        state: 'error',
        createdAt: new Date(Date.now()),
      });
      await build2.reload({ include: [Site, User] });

      const build21 = await factory.build({
        site,
        user: user2,
        state: 'success',
        createdAt: new Date(Date.now() - 3000),
      });
      await build21.reload({ include: [Site, User] });

      const build3 = await factory.build({
        site,
        user: user3,
        state: 'success',
        createdAt: new Date(Date.now() - 2000),
      });
      await build3.reload({ include: [Site, User] });

      const build4 = await factory.build({
        site: site2,
        user: user4,
        state: 'success',
        createdAt: new Date(Date.now() - 1000),
      });
      await build4.reload({ include: [Site, User] });

      const hasPermissionsStub = sinon
        .stub(GitLabHelper, 'getProjectPermissions')
        .returns({ push: true });

      const buildUser =
        await SourceCodePlatformHelper.getLastSuccessfulBuildUserWithPermissions(build1);

      expect(buildUser.id).to.equal(user3.id);
      sinon.assert.calledOnce(hasPermissionsStub);
    });

    it(`should not throw error if no build found`, async () => {
      const userConfig1 = {
        gitlabToken: 'gitlab-token',
        id: 1,
      };

      const userConfig2 = {
        gitlabToken: 'gitlab-token',
        id: 2,
      };

      const userConfig3 = {
        gitlabToken: 'gitlab-token',
        id: 3,
      };

      const userConfig4 = {
        gitlabToken: 'gitlab-token',
        id: 4,
      };

      let user1 = await factory.user(userConfig1);
      user1 = await user1.update(userConfig1);

      let user2 = await factory.user(userConfig2);
      user2 = await user2.update(userConfig2);

      let user3 = await factory.user(userConfig3);
      user3 = await user3.update(userConfig3);

      let user4 = await factory.user(userConfig4);
      user4 = await user4.update(userConfig4);

      let site = await factory.site();
      await site.update({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      let site2 = await factory.site();
      await site2.update({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const build1 = await factory.build({
        site: site,
        user: user1,
        state: 'created',
        createdAt: new Date(),
      });
      await build1.reload({ include: [Site, User] });

      const build2 = await factory.build({
        site: site2,
        user: user2,
        state: 'error',
        createdAt: new Date(Date.now()),
      });
      await build2.reload({ include: [Site, User] });

      const build21 = await factory.build({
        site: site2,
        user: user2,
        state: 'success',
        createdAt: new Date(Date.now() - 3000),
      });
      await build21.reload({ include: [Site, User] });

      const build3 = await factory.build({
        site: site2,
        user: user3,
        state: 'success',
        createdAt: new Date(Date.now() - 2000),
      });
      await build3.reload({ include: [Site, User] });

      const build4 = await factory.build({
        site: site2,
        user: user4,
        state: 'success',
        createdAt: new Date(Date.now() - 1000),
      });
      await build4.reload({ include: [Site, User] });

      const hasPermissionsStub = sinon
        .stub(GitLabHelper, 'getProjectPermissions')
        .returns({ push: true });

      const buildUser =
        await SourceCodePlatformHelper.getLastSuccessfulBuildUserWithPermissions(build1);

      expect(buildUser).to.be.null;
      sinon.assert.notCalled(hasPermissionsStub);
    });
  });
});
