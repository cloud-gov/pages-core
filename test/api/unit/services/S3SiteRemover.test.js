const nock = require('nock');
const { expect } = require('chai');

const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  HeadBucketCommand,
} = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const factory = require('../../support/factory');
const S3SiteRemover = require('../../../../api/services/S3SiteRemover');

const s3ServiceName = 'federalist-dev-s3';
const s3ServiceGuid = 'site-service-guid';
const awsBucketName = 'site-bucket-name';

function createServiceNocks(serviceName, guid) {
  const serviceInstanceResponse = factory.createCFAPIResource({
    guid,
    name: serviceName,
  });

  apiNocks.mockFetchServiceInstancesRequest(
    factory.createCFAPIResourceList({
      resources: [serviceInstanceResponse],
    }),
    serviceName,
  );
}

function createCredentialsNock(serviceName, guid, bucketName) {
  const credentialsResponse = factory.responses.credentials({
    bucket: bucketName,
  });

  apiNocks.mockFetchServiceInstanceCredentialsRequest(serviceName, {
    guid,
    credentials: credentialsResponse,
  });
}

const s3Mock = mockClient(S3Client);

describe('S3SiteRemover', () => {
  after(() => s3Mock.restore());

  beforeEach(() => {
    s3Mock.reset();
    s3Mock.on(HeadBucketCommand).resolves({});
    createServiceNocks(s3ServiceName, s3ServiceGuid);
  });

  afterEach(() => nock.cleanAll());

  describe('.removeSite(site)', () => {
    it("should delete all objects in the site's S3 bucket", (done) => {
      createCredentialsNock(s3ServiceName, s3ServiceGuid, awsBucketName);
      let site;
      const objectsToDelete = [
        'site/owner/repo/index.html',
        'demo/owner/repo/redirect',
        '_cache/asdfhjkl',
        'site/owner/repo',
        'demo/owner/repo',
        '_cache',
        'robots.txt',
      ];

      let deletionBucket;
      let deletedObjects;

      s3Mock
        .on(ListObjectsV2Command)
        .resolves({
          IsTruncated: false,
          Contents: objectsToDelete.map((object) => ({
            Key: object,
          })),
          ContinuationToken: 'A',
          NextContinuationToken: null,
        })
        .on(DeleteObjectsCommand)
        .callsFake((input) => {
          deletionBucket = input.Bucket;
          deletedObjects = input.Delete.Objects;
          return {};
        });

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      factory
        .site({
          awsBucketName,
          s3ServiceName,
        })
        .then((model) => {
          site = model;
          return S3SiteRemover.removeSite(site);
        })
        .then(() => {
          expect(deletionBucket).to.equal(awsBucketName);
          expect(deletedObjects.length).to.equal(objectsToDelete.length);
          expect(deletedObjects).to.have.deep.members(
            objectsToDelete.map((object) => ({
              Key: object,
            })),
          );
          done();
        });
    });

    it('should resolve if no bucket exists', (done) => {
      mockTokenRequest();
      apiNocks.mockDefaultCredentials(false);

      s3Mock
        .on(ListObjectsV2Command, {
          Bucket: undefined,
          ContinuationToken: undefined,
          MaxKeys: undefined,
        })
        .resolves({
          IsTruncated: false,
          CommonPrefixes: [],
          Contents: [],
          ContinuationToken: 'A',
          NextContinuationToken: null,
        })
        .on(DeleteObjectsCommand, {
          Bucket: undefined,
          Delete: {
            Objects: [],
          },
        })
        .resolves();

      factory
        .site()
        .then((site) => S3SiteRemover.removeSite(site))
        .then(done);
    });
  });

  describe('.removeInfrastructure', () => {
    beforeEach(() => createCredentialsNock(s3ServiceName, s3ServiceGuid, awsBucketName));

    it(`should delete the bucket and proxy route service
        when site is in a private bucket`, (done) => {
      let site;
      const s3Service = 'this-is-a-s3-service';
      const s3Guid = '8675-three-o-9';
      const routeName = 'route-hostname-is-bucket-name';
      const routeGuid = 'bev-hills-90210';

      mockTokenRequest();
      apiNocks.mockDeleteService(s3Service, s3Guid);
      apiNocks.mockDeleteRoute(routeName, routeGuid);

      factory
        .site({
          s3ServiceName: s3Service,
          awsBucketName: routeName,
        })
        .then((model) => {
          site = model;

          return S3SiteRemover.removeInfrastructure(site);
        })
        .then((res) => {
          expect(res.guid).to.equal(s3Guid);
          done();
        });
    });

    it('should resolve when services do not exist', (done) => {
      let site;
      const s3Service = 'this-is-a-s3-service';
      const s3Guid = '8675-three-o-9';
      const routeName = 'route-hostname-is-bucket-name';
      const routeGuid = 'bev-hills-90210';

      mockTokenRequest();
      apiNocks.mockDeleteService(s3Service, s3Guid, false);
      apiNocks.mockDeleteRoute(routeName, routeGuid, false);

      factory
        .site({
          s3ServiceName: s3Service,
          awsBucketName: routeName,
        })
        .then((model) => {
          site = model;

          return S3SiteRemover.removeInfrastructure(site);
        })
        .then(done);
    });
  });
});
