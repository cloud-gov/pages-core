const nock = require('nock');
const { expect } = require('chai');
const sinon = require('sinon');
const {
  rotateBucketKey,
  rotateSitesBucketKeys,
} = require('../../../../api/services/SiteBucketKeyRotator');
const CFApiClient = require('../../../../api/utils/cfApiClient');
const factory = require('../../support/factory');
const { Site } = require('../../../../api/models');
const {
  mockBucketKeyRotator,
  mockDefaultCredentials,
} = require('../../support/cfAPINocks');
const mockTokenRequest = require('../../support/cfAuthNock');

const cfApi = new CFApiClient();

describe('SiteBucketKeyRotator', () => {
  afterEach(() =>
    Site.truncate({
      force: true,
      cascade: true,
    }),
  );

  beforeEach(() => {
    mockTokenRequest();
    mockDefaultCredentials();
  });

  describe('rotateBucketKey', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should rotate a service instance credential if it exists', async () => {
      const awsBucketKeyUpdatedAtInitial = new Date(1000000);
      const credentialsGuid = 'cred-guid';
      const site = await factory.site({
        awsBucketKeyUpdatedAt: awsBucketKeyUpdatedAtInitial,
      });
      const instance1 = factory.createCFAPIResource({
        name: site.s3ServiceName,
      });
      const instanceResponses = factory.createCFAPIResourceList({
        resources: [instance1],
      });

      sinon
        .stub(cfApi, 'fetchServiceInstance')
        .withArgs(site.s3ServiceName)
        .resolves(instanceResponses);
      sinon
        .stub(cfApi, 'fetchCredentialBindingsInstance')
        .withArgs(`${site.s3ServiceName}-key`)
        .resolves({
          guid: credentialsGuid,
        });
      sinon
        .stub(cfApi, 'deleteServiceInstanceCredentials')
        .withArgs(credentialsGuid)
        .resolves();
      sinon
        .stub(cfApi, 'createServiceKey')
        .withArgs(site.s3ServiceName, `${site.s3ServiceName}-key`)
        .resolves();

      const result = await rotateBucketKey(site, cfApi, 0);

      expect(result.awsBucketKeyUpdatedAt).to.be.greaterThan(
        awsBucketKeyUpdatedAtInitial,
      );
    });

    it(`should rotate a service instance credential
        if credential is not found`, async () => {
      const awsBucketKeyUpdatedAtInitial = new Date(1000000);
      const site = await factory.site({
        awsBucketKeyUpdatedAt: awsBucketKeyUpdatedAtInitial,
      });
      const instance1 = factory.createCFAPIResource({
        name: site.s3ServiceName,
      });
      const instanceResponses = factory.createCFAPIResourceList({
        resources: [instance1],
      });

      sinon
        .stub(cfApi, 'fetchServiceInstance')
        .withArgs(site.s3ServiceName)
        .resolves(instanceResponses);
      sinon
        .stub(cfApi, 'fetchCredentialBindingsInstance')
        .withArgs(`${site.s3ServiceName}-key`)
        .rejects({
          message: 'Not Found',
        });
      sinon
        .stub(cfApi, 'createServiceKey')
        .withArgs(site.s3ServiceName, `${site.s3ServiceName}-key`)
        .resolves();

      const result = await rotateBucketKey(site, cfApi);

      expect(result.awsBucketKeyUpdatedAt).to.be.greaterThan(
        awsBucketKeyUpdatedAtInitial,
      );
    });
  });

  describe('rotateSitesBucketKeys', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    it('should query a subset of sites and rotate keys successfully', async () => {
      const serviceInstanceName = 'test-service';
      const serviceInstanceGuid = 'this-is-a-guid';
      const awsBucketKeyUpdatedAt = new Date(1000000);
      const credentialsInstance = {
        guid: 'credentials-guid',
        credentials: {
          a: 1,
          b: 'two',
        },
      };
      const [site1] = await Promise.all([
        factory.site({
          s3ServiceName: serviceInstanceName,
          awsBucketKeyUpdatedAt,
        }),
        factory.site(),
        factory.site(),
        factory.site(),
        factory.site(),
      ]);

      mockBucketKeyRotator({
        serviceInstanceName,
        serviceInstanceGuid,
        credentialsInstance,
      });

      const results = await rotateSitesBucketKeys({
        limit: 1,
        sleepNumber: 0,
      });

      expect(results).to.have.length(1);
      results.map((r) => {
        expect(r.status).to.equal('fulfilled');
        expect(r.value.dataValues.id).to.equal(site1.id);
      });
    });

    it('should skip credentials deletion if they do not exist', async () => {
      const serviceInstanceName = 'test-service';
      const serviceInstanceGuid = 'this-is-a-guid';
      const awsBucketKeyUpdatedAt = new Date(1000000);
      const [site1] = await Promise.all([
        factory.site({
          s3ServiceName: serviceInstanceName,
          awsBucketKeyUpdatedAt,
        }),
        factory.site(),
        factory.site(),
        factory.site(),
        factory.site(),
      ]);

      mockBucketKeyRotator({
        serviceInstanceName,
        serviceInstanceGuid,
      });

      const results = await rotateSitesBucketKeys({
        limit: 1,
        sleepNumber: 0,
      });

      expect(results).to.have.length(1);
      results.map((r) => {
        expect(r.status).to.equal('fulfilled');
        expect(r.value.dataValues.id).to.equal(site1.id);
      });
    });

    it('should return an array of rejected promises', async () => {
      const limit = 3;
      await Promise.all([
        factory.site(),
        factory.site(),
        factory.site(),
        factory.site(),
        factory.site(),
      ]);

      const results = await rotateSitesBucketKeys({
        limit,
        sleepNumber: 0,
      });

      expect(results).to.have.length(limit);
      results.map((r) => {
        expect(r.status).to.equal('rejected');
      });
    });
  });
});
