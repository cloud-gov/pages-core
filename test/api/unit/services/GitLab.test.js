const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');

const config = require('../../../../config');
const { logger } = require('../../../../winston');
const {
  getReqHeaders,
  getRefreshTokenBody,
  nockRefreshTokenWithResponse,
  getClientCredentials,
  getRefreshToken200Response,
} = require('../../support/gitlabAPINocks');
const {
  fetchRefreshUserOAuthTokens,
  normalizeUrl,
  revokeUserOAuthTokens,
  getProcessedWebhookPayload,
} = require('../../../../api/services/GitLab');

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
gitlabConfig.clientID = 'mock-client-id';
gitlabConfig.clientSecret = 'mock-client-secret';
gitlabConfig.callbackURL = 'https://localhost:1337/auth/gitlab/callback';
gitlabConfig.baseURL = 'https://workshop.cloud.gov/';

const refreshToken400Response = {
  error: 'invalid_grant',
  error_description:
    'The provided authorization grant is invalid, expired, revoked, ' +
    'does not match the redirection URI used in the authorization request, ' +
    'or was issued to another client.',
};

function getMockUser() {
  return {
    gitlabToken: 'mock-access-token',
    gitlabRefreshToken: 'mock-refresh-token',
  };
}

function nockRevokeToken(accessToken, tokenToRevoke) {
  return nock(gitlabConfig.baseURL, getReqHeaders(accessToken)).post('/oauth/revoke', {
    ...getClientCredentials(gitlabConfig),
    token: tokenToRevoke,
  });
}

function nockRevokeTokenWithResponse(
  tokenToRevoke,
  accessToken,
  responseStatusCode,
  response,
) {
  return nockRevokeToken(accessToken, tokenToRevoke).reply(responseStatusCode, response);
}

function nockRevokeTokenWithError(tokenToRevoke, accessToken, error) {
  return nockRevokeToken(accessToken, tokenToRevoke).replyWithError(error);
}

function nockRefreshTokenWithError(accessToken, refreshToken, error) {
  return nock(gitlabConfig.baseURL, getReqHeaders(accessToken))
    .post('/oauth/token', getRefreshTokenBody(gitlabConfig, refreshToken))
    .replyWithError(error);
}

describe('', () => {
  describe('.fetchRefreshUserOAuthTokens(user)', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    it('should call  oauth/token endpoint and return response 200', async () => {
      const user = getMockUser();
      const refresh = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        200,
        getRefreshToken200Response(),
      );
      const response = await fetchRefreshUserOAuthTokens(user);

      expect(response.ok).to.equal(true);
      expect(await response.json()).to.deep.equal(getRefreshToken200Response());
      expect(refresh.isDone()).to.equal(true);
    });

    it('should call  oauth/token endpoint and return response 400', async () => {
      const user = getMockUser();
      const refresh = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        400,
        refreshToken400Response,
      );

      const response = await fetchRefreshUserOAuthTokens(user);

      expect(response.ok).to.be.false;
      expect(response.status).to.equal(400);
      expect((await response.json()).error).to.equal('invalid_grant');
      expect(refresh.isDone()).to.equal(true);
    });
  });

  describe('.revokeUserOAuthTokens(user, resetUserOAuthTokens)', () => {
    let loggerWarnStub;
    let loggerErrorStub;
    let resetUserOAuthTokensStub;

    beforeEach(() => {
      nock.cleanAll();
      sinon.restore();

      loggerWarnStub = sinon.stub(logger, 'warn');
      loggerErrorStub = sinon.stub(logger, 'error');
      resetUserOAuthTokensStub = sinon.stub();
    });

    afterEach(() => {
      nock.cleanAll();
      sinon.restore();
    });

    it('should revoke both tokens and verify refresh returns invalid_grant', async () => {
      const user = getMockUser();

      const revokeAccessToken = nockRevokeTokenWithResponse(
        user.gitlabToken,
        user.gitlabToken,
        200,
        {},
      );
      const revokeRefreshToken = nockRevokeTokenWithResponse(
        user.gitlabRefreshToken,
        user.gitlabToken,
        200,
        {},
      );
      const refresh = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        400,
        refreshToken400Response,
      );

      await revokeUserOAuthTokens(user, resetUserOAuthTokensStub);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;
      expect(resetUserOAuthTokensStub.called).to.be.true;

      expect(loggerWarnStub.called).to.be.false;
      expect(loggerErrorStub.called).to.be.false;
    });

    it('should warn if token is still refreshable after revoking tokens', async () => {
      const user = getMockUser();

      const revokeAccessToken = nockRevokeTokenWithResponse(
        user.gitlabToken,
        user.gitlabToken,
        200,
        {},
      );
      const revokeRefreshToken = nockRevokeTokenWithResponse(
        user.gitlabRefreshToken,
        user.gitlabToken,
        200,
        {},
      );
      const refresh = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        200,
        getRefreshToken200Response(),
      );

      await revokeUserOAuthTokens(user, resetUserOAuthTokensStub);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;
      expect(resetUserOAuthTokensStub.called).to.be.true;

      expect(loggerWarnStub.called).to.be.true;
      expect(loggerWarnStub.args[0]).to.deep.equal([
        'GitLab: Unexpected token refresh response after tokens were revoked: 200',
        getRefreshToken200Response(),
      ]);
      expect(loggerErrorStub.called).to.be.false;
    });

    it('should catch and log error if revoke access token request fails', async () => {
      const user = getMockUser();

      const revokeAccessToken = nockRevokeTokenWithError(
        user.gitlabToken,
        user.gitlabToken,
        'Network error while revoking access token.',
      );
      const revokeRefreshToken = nockRevokeTokenWithResponse(
        user.gitlabRefreshToken,
        user.gitlabToken,
        200,
        {},
      );
      const refresh = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        400,
        refreshToken400Response,
      );

      await revokeUserOAuthTokens(user, resetUserOAuthTokensStub);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;
      expect(resetUserOAuthTokensStub.called).to.be.true;

      expect(loggerWarnStub.called).to.be.false;
      expect(loggerErrorStub.called).to.be.true;
      expect(loggerErrorStub.args[0][0]).to.deep.equal(
        'GitLab: Error revoking GitLab access token.',
      );
      expect(loggerErrorStub.args[0][1]).to.deep.equal(
        'Network error while revoking access token.',
      );
    });

    it('should catch and log error if revoke refresh token request fails', async () => {
      const user = getMockUser();

      const revokeAccessToken = nockRevokeTokenWithResponse(
        user.gitlabToken,
        user.gitlabToken,
        200,
        {},
      );
      const revokeRefreshToken = nockRevokeTokenWithError(
        user.gitlabRefreshToken,
        user.gitlabToken,
        'Network error while revoking refresh token.',
      );
      const refresh = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        400,
        refreshToken400Response,
      );

      await revokeUserOAuthTokens(user, resetUserOAuthTokensStub);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;
      expect(resetUserOAuthTokensStub.called).to.be.true;

      expect(loggerWarnStub.called).to.be.false;
      expect(loggerErrorStub.called).to.be.true;
      expect(loggerErrorStub.args[0][0]).to.deep.equal(
        'GitLab: Error revoking GitLab refresh token.',
      );
      expect(loggerErrorStub.args[0][1]).to.deep.equal(
        'Network error while revoking refresh token.',
      );
    });

    it('should catch and log error if refresh tokens request fails', async () => {
      const user = getMockUser();

      const revokeAccessToken = nockRevokeTokenWithResponse(
        user.gitlabToken,
        user.gitlabToken,
        200,
        {},
      );
      const revokeRefreshToken = nockRevokeTokenWithResponse(
        user.gitlabRefreshToken,
        user.gitlabToken,
        200,
        {},
      );
      const refresh = nockRefreshTokenWithError(
        user.gitlabToken,
        user.gitlabRefreshToken,
        'Network error while refreshing tokens.',
      );

      await revokeUserOAuthTokens(user, resetUserOAuthTokensStub);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;
      expect(resetUserOAuthTokensStub.called).to.be.true;

      expect(loggerWarnStub.called).to.be.false;
      expect(loggerErrorStub.called).to.be.true;
      expect(loggerErrorStub.args[0][0]).to.deep.equal(
        'GitLab: Error revoking GitLab tokens.',
      );
      expect(loggerErrorStub.args[0][1]).to.deep.equal(
        'Network error while refreshing tokens.',
      );
    });
  });

  describe('.normalizeUrl()', () => {
    it('should remove trailing slash from url', async () => {
      gitlabConfig.baseURL = 'https://workshop.cloud.gov/trailing_slash/';
      expect(normalizeUrl(gitlabConfig.baseURL)).to.equal(
        'https://workshop.cloud.gov/trailing_slash',
      );
    });

    it('should not update url if there is no trailing slash', async () => {
      gitlabConfig.baseURL = 'https://workshop.cloud.gov/no_trailing_slash';
      expect(normalizeUrl(gitlabConfig.baseURL)).to.equal(
        'https://workshop.cloud.gov/no_trailing_slash',
      );
    });

    it('does not throw an error', async () => {
      expect(normalizeUrl(null)).to.equal(undefined);
    });
  });

  describe('.getProcessedWebhookPayload(payload)', () => {
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
      expect(getProcessedWebhookPayload(payload)).to.deep.equal({
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
});
