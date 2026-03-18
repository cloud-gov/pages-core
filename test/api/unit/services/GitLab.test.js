const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');

const config = require('../../../../config');
const {
  fetchRefreshTokens,
  revokeUserGitLabTokens,
  getBaseUrl,
} = require('../../../../api/services/GitLab');
const { logger } = require('../../../../winston');

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
gitlabConfig.clientID = 'mock-client-id';
gitlabConfig.clientSecret = 'mock-client-secret';
gitlabConfig.callbackURL = 'https://localhost:1337/auth/gitlab/callback';
gitlabConfig.baseURL = 'http://workshop.cloud.gov/';

const clientCredentials = {
  client_id: gitlabConfig.clientID,
  client_secret: gitlabConfig.clientSecret,
};

const refreshToken200Response = {
  access_token: 'new-access-token',
  expires_in: 7200,
  refresh_token: 'new-refresh-token',
  created_at: '2026-03-17T17:22:09.904Z',
};

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

function getHeaders(accessToken) {
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Bearer ${accessToken}`,
  };
}

function getReqheaders(accessToken) {
  return { reqheaders: getHeaders(accessToken) };
}

function getRefreshTokenBody(refreshToken) {
  return {
    ...clientCredentials,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    redirect_uri: gitlabConfig.callbackURL,
  };
}

function nockRevokeToken(accessToken, tokenToRevoke) {
  return nock(gitlabConfig.baseURL, getReqheaders(accessToken)).post('/oauth/revoke', {
    ...clientCredentials,
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

function nockRefreshTokenWithResponse(
  accessToken,
  refreshToken,
  responseStatusCode,
  response,
) {
  return nock(gitlabConfig.baseURL, getReqheaders(accessToken))
    .post('/oauth/token', getRefreshTokenBody(refreshToken))
    .reply(responseStatusCode, response);
}

function nockRefreshTokenWithError(accessToken, refreshToken, error) {
  return nock(gitlabConfig.baseURL, getReqheaders(accessToken))
    .post('/oauth/token', getRefreshTokenBody(refreshToken))
    .replyWithError(error);
}

describe('GitLab', () => {
  describe('.fetchRefreshTokens(user)', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    it('should call GitLab oauth/token endpoint and return response 200', async () => {
      const user = getMockUser();
      const refresh = nockRefreshTokenWithResponse(
        user.gitlabToken,
        user.gitlabRefreshToken,
        200,
        refreshToken200Response,
      );
      const response = await fetchRefreshTokens(user);

      expect(response.ok).to.equal(true);
      expect(await response.json()).to.deep.equal(refreshToken200Response);
      expect(refresh.isDone()).to.equal(true);
    });

    it('should call GitLab oauth/token endpoint and return response 400', async () => {
      const user = getMockUser();
      const refresh = nockRefreshTokenWithResponse(
        user.gitlabToken,
        user.gitlabRefreshToken,
        400,
        refreshToken400Response,
      );

      const response = await fetchRefreshTokens(user);

      expect(response.ok).to.be.false;
      expect(response.status).to.equal(400);
      expect((await response.json()).error).to.equal('invalid_grant');
      expect(refresh.isDone()).to.equal(true);
    });
  });

  describe('.revokeUserGitLabTokens(user)', () => {
    let loggerWarnStub;
    let loggerErrorStub;

    beforeEach(() => {
      nock.cleanAll();
      sinon.restore();

      loggerWarnStub = sinon.stub(logger, 'warn');
      loggerErrorStub = sinon.stub(logger, 'error');
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
        user.gitlabToken,
        user.gitlabRefreshToken,
        400,
        refreshToken400Response,
      );

      await revokeUserGitLabTokens(user);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;

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
        user.gitlabToken,
        user.gitlabRefreshToken,
        200,
        refreshToken200Response,
      );

      await revokeUserGitLabTokens(user);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;

      expect(loggerWarnStub.called).to.be.true;
      expect(loggerWarnStub.args[0]).to.deep.equal([
        'GitLab: Unexpected token refresh response after tokens were revoked: 200',
        refreshToken200Response,
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
        user.gitlabToken,
        user.gitlabRefreshToken,
        400,
        refreshToken400Response,
      );

      await revokeUserGitLabTokens(user);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;

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
        user.gitlabToken,
        user.gitlabRefreshToken,
        400,
        refreshToken400Response,
      );

      await revokeUserGitLabTokens(user);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;

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

      await revokeUserGitLabTokens(user);

      expect(revokeAccessToken.isDone()).to.be.true;
      expect(revokeRefreshToken.isDone()).to.be.true;
      expect(refresh.isDone()).to.be.true;

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

  describe('.getBaseUrl()', () => {
    it('should remove trailing slash from url', async () => {
      gitlabConfig.baseURL = 'https://workshop.cloud.gov/trailing_slash/';
      expect(getBaseUrl(gitlabConfig.baseURL)).to.equal(
        'https://workshop.cloud.gov/trailing_slash',
      );
    });

    it('should not update url if there is no trailing slash', async () => {
      gitlabConfig.baseURL = 'https://workshop.cloud.gov/no_trailing_slash';
      expect(getBaseUrl(gitlabConfig.baseURL)).to.equal(
        'https://workshop.cloud.gov/no_trailing_slash',
      );
    });
  });

  it('does not throw an error', async () => {
    expect(getBaseUrl(null)).to.equal(undefined);
  });
});
