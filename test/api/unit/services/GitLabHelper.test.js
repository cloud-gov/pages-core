const { expect } = require('chai');

const config = require('../../../../config');
const {
  mapWebhookRequestToGitHubFormat,
} = require('../../../../api/services/GitLabHelper');
const { logger } = require('../../../../winston');
const nock = require('nock');
const { createSiteUserOrg } = require('../../support/site-user');
const { Site } = require('../../../../api/models');
const GitLabHelper = require('../../../../api/services/GitLabHelper');
const sinon = require('sinon');
const {
  getRefreshToken200Response,
  nockRefreshTokenWithResponse,
  getRefreshToken400Response,
  getNockGetProjectUser,
} = require('../../support/gitlabAPINocks');
const { getUrlEncodedPath } = require('../../../../api/services/GitLab');
const factory = require('../../support/factory');

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
gitlabConfig.clientID = 'mock-client-id';
gitlabConfig.clientSecret = 'mock-client-secret';
gitlabConfig.callbackURL = 'https://localhost:1337/auth/gitlab/callback';
gitlabConfig.baseURL = 'https://workshop.cloud.gov/';

describe('GitLabHelper', () => {
  describe('.mapWebhookRequestToGitHubFormat(payload)', () => {
    const payload = {
      object_kind: 'push',
      event_name: 'push',
      before: '95790bf891e76fee5e1747ab589903a6a1f80f22',
      after: 'da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
      ref: 'refs/heads/master',
      ref_protected: true,
      checkout_sha: 'da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
      message: 'Hello World',
      user_id: 4,
      user_name: 'John Smith',
      user_username: 'jsmith',
      user_email: 'john@example.com',
      user_avatar:
        'https://s.gravatar.com/avatar/d4c74594d841139328695756648b6bd6?s=8://s.gravatar.com/avatar/d4c74594d841139328695756648b6bd6?s=80',
      project_id: 15,
      project: {
        id: 15,
        name: 'Diaspora',
        description: '',
        web_url: 'https://workshop.cloud.gov/cloud-gov/pages/project',
        avatar_url: null,
        git_ssh_url: 'git@example.com:mike/diaspora.git',
        git_http_url: 'http://example.com/mike/diaspora.git',
        namespace: 'Mike',
        visibility_level: 0,
        path_with_namespace: 'mike/diaspora',
        default_branch: 'master',
        ci_config_path: null,
        homepage: 'http://example.com/mike/diaspora',
        url: 'git@example.com:mike/diaspora.git',
        ssh_url: 'git@example.com:mike/diaspora.git',
        http_url: 'http://example.com/mike/diaspora.git',
      },
      commits: [
        {
          id: 'b6568db1bc1dcd7f8b4d5a946b0b91f9dacd7327',
          message:
            'Update Catalan translation to e38cb41.\n\nSee https://gitlab.com/gitlab-org/gitlab for more information',
          title: 'Update Catalan translation to e38cb41.',
          timestamp: '2011-12-12T14:27:31+02:00',
          url: 'http://example.com/mike/diaspora/commit/b6568db1bc1dcd7f8b4d5a946b0b91f9dacd7327',
          author: {
            name: 'Jordi Mallach',
            email: 'jordi@softcatala.org',
          },
          added: ['CHANGELOG'],
          modified: ['app/controller/application.rb'],
          removed: [],
        },
        {
          id: 'da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
          message: 'fixed readme',
          title: 'fixed readme',
          timestamp: '2012-01-03T23:36:29+02:00',
          url: 'http://example.com/mike/diaspora/commit/da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
          author: {
            name: 'GitLab dev user',
            email: 'gitlabdev@dv6700.(none)',
          },
          added: ['CHANGELOG'],
          modified: ['app/controller/application.rb'],
          removed: [],
        },
      ],
      total_commits_count: 4,
      push_options: {},
      repository: {
        name: 'Diaspora',
        url: 'git@example.com:mike/diaspora.git',
        description: '',
        homepage: 'http://example.com/mike/diaspora',
        git_http_url: 'http://example.com/mike/diaspora.git',
        git_ssh_url: 'git@example.com:mike/diaspora.git',
        visibility_level: 0,
      },
    };

    it('should return payload in GitHub format', async () => {
      gitlabConfig.baseURL = 'https://workshop.cloud.gov/';
      expect(mapWebhookRequestToGitHubFormat(payload)).to.deep.equal({
        after: 'da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
        commits: [{}],
        owner: 'cloud-gov',
        ref: 'refs/heads/master',
        repository: {
          pushed_at: 1323692851,
          repository_path: 'pages/project',
        },
        sender: { login: 'jsmith', gitlabUserId: '4' },
      });
    });
  });

  describe('.deleteWebhook(user, site)', () => {
    let loggerErrorStub;

    beforeEach(() => {
      nock.cleanAll();
      sinon.restore();
      loggerErrorStub = sinon.stub(logger, 'error');
    });
    afterEach(() => {
      nock.cleanAll();
      sinon.restore();
    });

    it('should delete webhook if user authorized to delete site', async () => {
      const { site, user } = await createSiteUserOrg({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const webhookId = 111;
      site.update({
        webhookId,
      });

      const gitlabToken = 'gitlabToken';
      const gitlabUserId = 1234567890;
      await user.update({ gitlabToken, gitlabUserId });

      nock(gitlabConfig.baseURL)
        .persist()
        .post('/oauth/token')
        .reply(
          200,
          getRefreshToken200Response({
            access_token: gitlabToken,
            refresh_token: 'gitlabRefreshToken',
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
        .reply(200, { access_level: GitLabHelper.GITLAB_ACCESS_LEVEL_OWNER });

      const deleteWebhook = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .delete(`/api/v4/projects/${site.owner}%2F${site.repository}/hooks/${webhookId}`)
        .reply(200);

      await GitLabHelper.deleteWebhook(user, site);

      expect(gitlabProjectUser.isDone()).to.be.true;
      return expect(deleteWebhook.isDone()).to.be.true;
    });

    it('should not delete webhook if user is not authorized to delete site', async () => {
      const { site, user } = await createSiteUserOrg({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const webhookId = 111;
      site.update({
        webhookId,
      });

      const gitlabToken = 'gitlabToken';
      const gitlabUserId = 1234567890;
      await user.update({ gitlabToken, gitlabUserId });

      nock(gitlabConfig.baseURL)
        .persist()
        .post('/oauth/token')
        .reply(
          200,
          getRefreshToken200Response({
            access_token: gitlabToken,
            refresh_token: 'gitlabRefreshToken',
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

      const deleteWebhook = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .delete(`/api/v4/projects/${site.owner}%2F${site.repository}/hooks/${webhookId}`)
        .reply(200);

      await GitLabHelper.deleteWebhook(user, site);

      expect(gitlabProjectUser.isDone()).to.be.true;

      expect(loggerErrorStub.called).to.be.true;
      expect(loggerErrorStub.args[0][0]).to.deep.equal(
        `GitLab: Error deleting webhook 111 for https://workshop.cloud.gov/${site.owner}/${site.repository}.`,
      );
      expect(loggerErrorStub.args[0][1]).to.deep.equal(
        'You do not have required access level.',
      );

      return expect(deleteWebhook.isDone()).to.be.false;
    });

    it('should log error if delete webhook call fails', async () => {
      const { site, user } = await createSiteUserOrg({
        sourceCodePlatform: Site.Platforms.Workshop,
      });

      const webhookId = 111;
      site.update({
        webhookId,
      });

      const gitlabToken = 'gitlabToken';
      const gitlabUserId = 1234567890;
      await user.update({ gitlabToken, gitlabUserId });

      nock(gitlabConfig.baseURL)
        .persist()
        .post('/oauth/token')
        .reply(
          200,
          getRefreshToken200Response({
            access_token: gitlabToken,
            refresh_token: 'gitlabRefreshToken',
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
        .reply(200, { access_level: GitLabHelper.GITLAB_ACCESS_LEVEL_OWNER });

      const deleteWebhook = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .delete(`/api/v4/projects/${site.owner}%2F${site.repository}/hooks/${webhookId}`)
        .reply(404);

      await GitLabHelper.deleteWebhook(user, site);

      expect(gitlabProjectUser.isDone()).to.be.true;

      expect(loggerErrorStub.called).to.be.true;
      expect(loggerErrorStub.args[0][0]).to.deep.equal(
        `GitLab: Error deleting webhook 111 for https://workshop.cloud.gov/${site.owner}/${site.repository} - response: 404 - {}.`,
      );
      return expect(deleteWebhook.isDone()).to.be.true;
    });
  });

  describe('.refreshUserGitLabTokenIfNeeded(user, now, site)', () => {
    let refreshNock;
    const dateNow = Date.now();
    const expiresLessThanAnHour = new Date(
      dateNow + GitLabHelper.TOKEN_PROACTIVE_REFRESH_MS - 1,
    );
    const expiresMoreThanInAnHour = new Date(
      dateNow + GitLabHelper.TOKEN_PROACTIVE_REFRESH_MS + 1,
    );
    const alreadyExpired = new Date(dateNow - GitLabHelper.TOKEN_PROACTIVE_REFRESH_MS);

    const user = {
      gitlabToken: 'mock-access-token-old',
      gitlabRefreshToken: 'mock-refresh-token-old',
      update: () => {},
    };

    beforeEach(() => {
      nock.cleanAll();
      sinon.restore();

      refreshNock = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        200,
        getRefreshToken200Response(),
      );
    });
    afterEach(() => {
      nock.cleanAll();
      sinon.restore();
    });

    const testNoTokenRefresh = () => {
      expect(refreshNock.isDone()).to.equal(false);
    };

    const testTokenRefresh = () => {
      expect(refreshNock.isDone()).to.equal(true);
    };

    it('should refresh token if it expires in less than an hour', async () => {
      await GitLabHelper.refreshUserGitLabTokenIfNeeded(
        { ...user, gitlabExpiresAt: expiresLessThanAnHour },
        dateNow,
        'flow',
      );

      testTokenRefresh();
    });

    it('should refresh token if it already expired', async () => {
      await GitLabHelper.refreshUserGitLabTokenIfNeeded(
        { ...user, gitlabExpiresAt: alreadyExpired },
        dateNow,
        'flow',
      );

      testTokenRefresh();
    });

    it('should not throw error if token refresh fails', async () => {
      refreshNock = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        200,
        getRefreshToken400Response(),
      );

      await GitLabHelper.refreshUserGitLabTokenIfNeeded(
        { ...user, gitlabExpiresAt: expiresLessThanAnHour },
        dateNow,
        'flow',
      );

      testNoTokenRefresh();
    });

    it(`should not refresh token or throw an error 
             if there is no user or user  does not have a GitLab token`, async () => {
      await GitLabHelper.refreshUserGitLabTokenIfNeeded(null, dateNow, 'flow');
      await GitLabHelper.refreshUserGitLabTokenIfNeeded({}, dateNow, 'flow');
      await GitLabHelper.refreshUserGitLabTokenIfNeeded(
        { gitlabToken: null },
        dateNow,
        'flow',
      );

      testNoTokenRefresh();
    });

    it('should not refresh token if token is valid for more than an hour', async () => {
      await GitLabHelper.refreshUserGitLabTokenIfNeeded(
        { gitlabExpiresAt: expiresMoreThanInAnHour },
        dateNow,
        'flow',
      );

      testNoTokenRefresh();
    });
  });

  describe('.sendCommitState(user, site, options)', () => {
    const now = new Date();
    const user = {
      gitlabToken: 'mock-access-token',
      gitlabExpiresAt: now,
      username: 'mock-username',
      id: 12,
      update: () => {},
    };

    const options = {
      target_url: 'target_url',
      description: 'description',
      context: 'context',
      sha: 'sha',
    };

    const sourceCodeUrl = 'sourceCodeUrl';

    const nockPostCommitState = (state, responseStatusCode, responseBody) =>
      nock(gitlabConfig.baseURL, {
        reqheaders: {
          authorization: `Bearer ${user.gitlabToken}`,
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
        },
      })
        .post(
          // eslint-disable-next-line max-len
          `/api/v4/projects/${getUrlEncodedPath(sourceCodeUrl)}/statuses/${options.sha}?state=${state}`,
          {
            state: state, // pending, running, success, failed, canceled, skipped
            target_url: options.target_url,
            description: options.description,
            context: options.context,
          },
        )
        .reply(responseStatusCode, responseBody);

    beforeEach(() => {
      nock.cleanAll();
      sinon.restore();
    });
    afterEach(() => {
      nock.cleanAll();
      sinon.restore();
    });

    it('should not throw an error if commit state post is successful', async () => {
      async function postState(state) {
        const nock = nockPostCommitState(state, 200, {});

        await GitLabHelper.sendCommitState(
          user,
          { sourceCodeUrl },
          {
            ...options,
            state,
          },
        );

        expect(nock.isDone()).to.be.true;
      }

      await postState(GitLabHelper.GITLAB_COMMIT_STATE_RUNNING);
      await postState(GitLabHelper.GITLAB_COMMIT_STATE_SUCCESS);
      await postState(GitLabHelper.GITLAB_COMMIT_STATE_FAILED);
    });

    it('should not throw an error if reposting the same commit status', async () => {
      async function repostSate(state) {
        const nock = nockPostCommitState(state, 400, {
          message: 'Cannot transition status via ...',
        });

        await GitLabHelper.sendCommitState(
          user,
          { sourceCodeUrl },
          {
            ...options,
            state,
          },
        );

        expect(nock.isDone()).to.be.true;
      }

      await repostSate(GitLabHelper.GITLAB_COMMIT_STATE_RUNNING);
      await repostSate(GitLabHelper.GITLAB_COMMIT_STATE_SUCCESS);
      await repostSate(GitLabHelper.GITLAB_COMMIT_STATE_FAILED);
    });

    it(`should throw an error if different than reposting 
             the same commit status`, async () => {
      const nock = nockPostCommitState(GitLabHelper.GITLAB_COMMIT_STATE_RUNNING, 400, {
        message: 'Another Error',
      });

      await expect(
        GitLabHelper.sendCommitState(
          user,
          { sourceCodeUrl },
          {
            ...options,
            state: GitLabHelper.GITLAB_COMMIT_STATE_RUNNING,
          },
        ),
      ).to.be.rejectedWith(Error, /Failed to send commit state "running"*/);
      expect(nock.isDone()).to.be.true;
    });
  });

  describe('.getProjectAccessLevel(user, sourceCodeUrl))', () => {
    const userConfig = {
      gitlabToken: 'mock-access-token',
      username: 'mock-username',
      id: 12,
      update: () => {},
    };

    const gitlabUserId = 1111;
    const sourceCodeUrl = 'sourceCodeUrl';

    const nockGetGitLabUser = (responseStatusCode, user) =>
      nock(gitlabConfig.baseURL, {
        reqheaders: {
          authorization: `Bearer ${user.gitlabToken}`,
          accept: 'application/json',
        },
      })
        .get(`/api/v4/user`)
        .reply(responseStatusCode, { id: gitlabUserId });

    beforeEach(() => {
      nock.cleanAll();
    });
    afterEach(() => {
      nock.cleanAll();
    });

    it('should fetch user GitLab id if not in DB', async () => {
      const user = await factory.user();
      await user.update(userConfig);

      const nockGetGitLabUser_ = nockGetGitLabUser(200, user);

      const nockGetProjectUser = getNockGetProjectUser(
        user.gitlabToken,
        gitlabUserId,
        sourceCodeUrl,
        200,
        20,
      );

      expect(user.gitlabUserId).to.equal(null);

      const accessLevel = await GitLabHelper.getProjectAccessLevel(user, sourceCodeUrl);

      expect(nockGetGitLabUser_.isDone()).to.be.true;
      expect(nockGetProjectUser.isDone()).to.be.true;
      expect(user.gitlabUserId).to.equal(`${gitlabUserId}`);
      expect(accessLevel).to.deep.equal(20);
    });
  });
});
