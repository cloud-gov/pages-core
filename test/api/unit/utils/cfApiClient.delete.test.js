const { expect } = require('chai');
const nock = require('nock');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');

describe('CloudFoundryAPIClient Delete', () => {
  afterEach(() => nock.cleanAll());

  describe('.deleteRoute', () => {
    it('should delete a route', (done) => {
      const routeName = 'a-simple-route-to-be-deleted';
      const guid = '123456-abcdef';

      mockTokenRequest();
      apiNocks.mockDeleteRoute(routeName, guid);

      const cfApiClient = new CloudFoundryAPIClient();

      cfApiClient.deleteRoute(routeName)
        .then((res) => {
          expect(res.metadata.guid).to.equal(guid);
          done();
        })
        .catch(done);
    });

    it('should reject when route does not exist', (done) => {
      const notRoute = 'not-a-route';
      const aRoute = 'a-different-route';
      const guid = '123456-abcdef';

      mockTokenRequest();
      apiNocks.mockDeleteRoute(aRoute, guid);

      const cfApiClient = new CloudFoundryAPIClient();

      cfApiClient.deleteRoute(notRoute)
        .catch((err) => {
          expect(err).to.be.an('error');
          done();
        });
    });
  });
});
