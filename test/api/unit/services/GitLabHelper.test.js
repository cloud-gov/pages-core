const { expect } = require('chai');

const config = require('../../../../config');
const {
  mapWebhookResponseToGitHubFormat,
} = require('../../../../api/services/GitLabHelper');
const { logger } = require('../../../../winston');
const nock = require('nock');
const { createSiteUserOrg } = require('../../support/site-user');
const { Site } = require('../../../../api/models');
const GitLabHelper = require('../../../../api/services/GitLabHelper');
const sinon = require('sinon');

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
gitlabConfig.clientID = 'mock-client-id';
gitlabConfig.clientSecret = 'mock-client-secret';
gitlabConfig.callbackURL = 'https://localhost:1337/auth/gitlab/callback';
gitlabConfig.baseURL = 'https://workshop.cloud.gov/';

describe('GitLabHelper', () => {
  describe('.mapWebhookResponseToGitHubFormat(payload)', () => {
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
      expect(mapWebhookResponseToGitHubFormat(payload)).to.deep.equal({
        after: 'da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
        commits: [{}],
        owner: 'cloud-gov',
        ref: 'refs/heads/master',
        repository: {
          pushed_at: 1323692851,
          repository_path: 'pages/project',
        },
        sender: { login: 'jsmith' },
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

      const deleteWebhook = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .delete(`/api/v4/projects/${site.owner}%2F${site.repository}/hooks/${webhookId}`)
        .reply(200);

      await GitLabHelper.deleteWebhook(user, site);

      expect(gitlabUser.isDone()).to.be.true;
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

      const deleteWebhook = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .delete(`/api/v4/projects/${site.owner}%2F${site.repository}/hooks/${webhookId}`)
        .reply(200);

      await GitLabHelper.deleteWebhook(user, site);

      expect(gitlabUser.isDone()).to.be.true;
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

      const deleteWebhook = nock(gitlabConfig.baseURL, {
        Authorization: `Bearer ${gitlabToken}`,
        Accept: 'application/json',
      })
        .delete(`/api/v4/projects/${site.owner}%2F${site.repository}/hooks/${webhookId}`)
        .reply(404);

      await GitLabHelper.deleteWebhook(user, site);

      expect(gitlabUser.isDone()).to.be.true;
      expect(gitlabProjectUser.isDone()).to.be.true;

      expect(loggerErrorStub.called).to.be.true;
      expect(loggerErrorStub.args[0][0]).to.deep.equal(
        `GitLab: Error deleting webhook 111 for https://workshop.cloud.gov/${site.owner}/${site.repository} - response: 404.`,
      );
      return expect(deleteWebhook.isDone()).to.be.true;
    });
  });
});
