const nock = require('nock');
const { expect } = require('chai');

const AWSMocks = require('../../support/aws-mocks');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const factory = require('../../support/factory');
const S3SiteRemover = require('../../../../api/services/S3SiteRemover');

const s3ServiceName = 'site-service';
const s3ServiceGuid = 'site-service-guid';
const awsBucketName = 'site-bucket-name';

const mapSiteContents = (objects) => ({
  Contents: objects.map((Key) => ({ Key })),
});

const buildCacheObjects = (bucket) => {
  bucket.push('_cache/asdfhjkl');
  bucket.push('_cache/qwertyui');
  return bucket;
};

const buildSiteObjects = (qualifier = 'site', site, bucket) => {
  const prefix = `${qualifier}/${site.owner}/${site.repository}`;

  bucket.push(`${prefix}/index.html`);
  bucket.push(`${prefix}/redirect`);
  bucket.push(`${prefix}/redirect/index.html`);

  return bucket;
};

function createServiceNocks(serviceName, guid, bucketName) {
  const serviceInstanceResponse = factory.createCFAPIResource({
    guid,
    name: serviceName,
  });

  apiNocks.mockFetchServiceInstancesRequest(
    factory.createCFAPIResourceList({ resources: [serviceInstanceResponse] }),
    serviceName
  );

  const credentialsResponse = factory.responses.credentials({
    access_key_id: '',
    secret_access_key: '',
    region: '',
    bucket: bucketName,
  });

  apiNocks.mockFetchServiceInstanceCredentialsRequest(serviceName, {
    guid,
    credentials: credentialsResponse
  });
}

describe('S3SiteRemover', () => {
  beforeEach(() => {
    AWSMocks.mocks.S3.headBucket = () => ({ promise: () => Promise.resolve() });
    createServiceNocks(s3ServiceName, s3ServiceGuid, awsBucketName);
  });

  after(() => {
    AWSMocks.resetMocks();
  });

  afterEach(() => nock.cleanAll());

  describe('.removeSite(site)', () => {
    it('should delete all objects in the `site/<org>/<repo>`, `demo/<org>/<repo>`, `preview/<org>/<repo>`, and `_cache` directories', (done) => {
      const siteObjectsToDelete = [];
      const demoObjectsToDelete = [];
      const previewObjectsToDelete = [];
      const cacheObjectsToDelete = [];

      let site;
      let objectsWereDeleted = false;
      let siteObjectsWereListed = false;
      let demoObjectWereListed = false;
      let previewObjectsWereListed = false;
      let cacheObjectsWereListed = false;
      let objectsToDelete;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, cb) => {
        expect(params.Bucket).to.equal(awsBucketName);
        if (params.Prefix === `site/${site.owner}/${site.repository}/`) {
          siteObjectsWereListed = true;
          cb(null, mapSiteContents(siteObjectsToDelete));
        } else if (params.Prefix === `demo/${site.owner}/${site.repository}/`) {
          demoObjectWereListed = true;
          cb(null, mapSiteContents(demoObjectsToDelete));
        } else if (
          params.Prefix === `preview/${site.owner}/${site.repository}/`
        ) {
          previewObjectsWereListed = true;
          cb(null, mapSiteContents(previewObjectsToDelete));
        } else if (params.Prefix === '_cache/') {
          cacheObjectsWereListed = true;
          cb(null, mapSiteContents(cacheObjectsToDelete));
        }
      };

      AWSMocks.mocks.S3.deleteObjects = (params, cb) => {
        expect(params.Bucket).to.equal(awsBucketName);

        objectsToDelete = [
          ...siteObjectsToDelete,
          ...demoObjectsToDelete,
          ...previewObjectsToDelete,
          ...cacheObjectsToDelete,
          ...[
            `site/${site.owner}/${site.repository}`,
            `demo/${site.owner}/${site.repository}`,
            `preview/${site.owner}/${site.repository}`,
            '_cache',
          ],
          'robots.txt',
        ];

        expect(params.Delete.Objects).to.have.length(objectsToDelete.length);
        params.Delete.Objects.forEach((object) => {
          const index = objectsToDelete.indexOf(object.Key);
          expect(index).to.be.at.least(0);
          objectsToDelete.splice(index, 1);
        });

        objectsWereDeleted = true;
        cb(null, {});
      };

      factory
        .site({
          awsBucketName,
          s3ServiceName,
        })
        .then((model) => {
          site = model;

          buildSiteObjects('site', site, siteObjectsToDelete);
          buildSiteObjects('demo', site, demoObjectsToDelete);
          buildSiteObjects('preview', site, previewObjectsToDelete);
          buildCacheObjects(cacheObjectsToDelete);

          return S3SiteRemover.removeSite(site);
        })
        .then(() => {
          expect(siteObjectsWereListed).to.equal(true);
          expect(demoObjectWereListed).to.equal(true);
          expect(previewObjectsWereListed).to.equal(true);
          expect(cacheObjectsWereListed).to.equal(true);
          expect(objectsWereDeleted).to.equal(true);
          expect(objectsToDelete.length).to.equal(0);

          done();
        });
    });

    it('should delete objects in batches of 1000 at a time', (done) => {
      let deleteObjectsCallCount = 0;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, cb) =>
        cb(null, {
          Contents: Array(800)
            .fill(0)
            .map(() => ({ Key: 'abc123' })),
        });

      AWSMocks.mocks.S3.deleteObjects = (params, cb) => {
        expect(params.Delete.Objects).to.have.length.at.most(1000);
        deleteObjectsCallCount += 1;
        cb();
      };

      factory
        .site()
        .then((site) => S3SiteRemover.removeSite(site))
        .then(() => {
          // 800 site, 800 demo, 800 preview, 800 cache objects, robots.txt = 3201 total
          // 3201 objects means 4 groups of 1000
          expect(deleteObjectsCallCount).to.equal(4);
          done();
        });
    });

    it('should resolve if no bucket exists', (done) => {
      mockTokenRequest();
      apiNocks.mockDefaultCredentials(false);

      factory
        .site()
        .then((site) => S3SiteRemover.removeSite(site))
        .then(done);
    });
  });

  describe('.removeInfrastructure', () => {
    it('should delete the bucket and proxy route service when site is in a private bucket', (done) => {
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
