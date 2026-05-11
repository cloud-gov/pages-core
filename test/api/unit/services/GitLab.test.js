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
  getRefreshToken400Response,
} = require('../../support/gitlabAPINocks');
const {
  normalizeUrl,
  revokeUserOAuthTokens,
  refreshUserOAuthAccessTokens,
} = require('../../../../api/services/GitLab');
const { createSiteUserOrg } = require('../../support/site-user');
const { updateGitLabTokens } = require('../../../../api/services/user');

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
gitlabConfig.clientID = 'mock-client-id';
gitlabConfig.clientSecret = 'mock-client-secret';
gitlabConfig.callbackURL = 'https://localhost:1337/auth/gitlab/callback';
gitlabConfig.baseURL = 'https://workshop.cloud.gov/';

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

describe('GitLab', () => {
  describe('.refreshUserOAuthAccessTokens(user)', () => {
    beforeEach(() => {
      nock.cleanAll();
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should call  oauth/token endpoint and return response 200', async () => {
      const { user } = await createSiteUserOrg();
      await user.update({
        gitlabToken: 'old-gitlab-access-token',
        gitlabRefreshToken: 'old-gitlab-refresh-token',
      });
      const refresh = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        200,
        getRefreshToken200Response({
          access_token: 'new-gitlab-access-token',
          refresh_token: 'new-gitlab-refresh-token',
        }),
      );
      await refreshUserOAuthAccessTokens(user, updateGitLabTokens);

      expect(refresh.isDone()).to.equal(true);
      expect(user.gitlabToken).to.equal('new-gitlab-access-token');
      expect(user.gitlabRefreshToken).to.equal('new-gitlab-refresh-token');
    });

    it('should call  oauth/token endpoint and return response 400', async () => {
      const { user } = await createSiteUserOrg();
      await user.update({
        gitlabToken: 'old-gitlab-access-token',
        gitlabRefreshToken: 'old-gitlab-refresh-token',
      });
      const refresh = nockRefreshTokenWithResponse(
        gitlabConfig,
        user.gitlabToken,
        user.gitlabRefreshToken,
        400,
        getRefreshToken400Response(),
      );

      await expect(
        refreshUserOAuthAccessTokens(user, updateGitLabTokens),
      ).to.be.rejectedWith(Error, /error refreshing GitLab OAuth tokens*/);
      expect(refresh.isDone()).to.equal(true);
      expect(user.gitlabToken).to.equal('old-gitlab-access-token');
      expect(user.gitlabRefreshToken).to.equal('old-gitlab-refresh-token');
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
        getRefreshToken400Response(),
      );

      await revokeUserOAuthTokens(user, resetUserOAuthTokensStub);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;
      expect(resetUserOAuthTokensStub.called).to.be.true;

      expect(loggerWarnStub.called).to.be.false;
      // expect(loggerErrorStub.called).to.be.false;
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
      // expect(loggerErrorStub.called).to.be.false;
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
        getRefreshToken400Response(),
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
        getRefreshToken400Response(),
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

      gitlabConfig.baseURL = 'https://workshop.cloud.gov/';
      expect(normalizeUrl(gitlabConfig.baseURL)).to.equal('https://workshop.cloud.gov');
    });

    it('should not update url if there is no trailing slash', async () => {
      gitlabConfig.baseURL = 'https://workshop.cloud.gov/no_trailing_slash';
      expect(normalizeUrl(gitlabConfig.baseURL)).to.equal(
        'https://workshop.cloud.gov/no_trailing_slash',
      );

      gitlabConfig.baseURL = 'https://workshop.cloud.gov';
      expect(normalizeUrl(gitlabConfig.baseURL)).to.equal('https://workshop.cloud.gov');
    });

    it('does not throw an error', async () => {
      expect(normalizeUrl(null)).to.equal(undefined);
    });
  });
});
