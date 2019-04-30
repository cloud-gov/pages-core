const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const nock = require('nock');

const CloudFoundryAuthClient = require('../../../../api/utils/cfAuthClient');
const mockTokenRequest = require('../../support/cfAuthNock');

const mockToken = (expiration = (Date.now() / 1000) + 600) => (
  jwt.sign({ exp: expiration }, '123abc')
);


describe('CloudFoundryAuthClient', () => {
  describe('.accessToken()', () => {
    afterEach(() => nock.cleanAll());

    it('should fetch and resolve a new token if it has yet to fetch a token', (done) => {
      const accessToken = mockToken();
      mockTokenRequest(accessToken);

      const authClient = new CloudFoundryAuthClient();

      authClient.accessToken().then((token) => {
        expect(token).to.equal(accessToken);
        done();
      });
    });

    it('should fetch and resolve a new token if the current token is expired', (done) => {
      const accessToken = mockToken();
      mockTokenRequest(accessToken);

      const authClient = new CloudFoundryAuthClient();
      authClient.token = mockToken(Date.now() / 1000);

      authClient.accessToken().then((token) => {
        expect(token).to.equal(accessToken);
        done();
      });
    });

    it('should resolve the current token if it is not expired', (done) => {
      const accessToken = mockToken();

      const authClient = new CloudFoundryAuthClient();
      authClient.token = accessToken;

      authClient.accessToken().then((token) => {
        expect(token).to.equal(accessToken);
        done();
      });
    });
  });
});
