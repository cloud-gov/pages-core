const nock = require('nock');
const { expect } = require('chai');
const sinon = require('sinon');

const AWSMocks = require('../../support/aws-mocks');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const factory = require('../../support/factory');
const config = require('../../../../config');
const S3SiteRemover = require('../../../../api/services/S3SiteRemover');

const mapSiteContents = objects => ({
  Contents: objects.map(Key => ({ Key })),
});

const buildSiteObjects = (qualifier = 'site', site, bucket) => {
  const prefix = `${qualifier}/${site.owner}/${site.repository}`;

  bucket.push(`${prefix}/index.html`);
  bucket.push(`${prefix}/redirect`);
  bucket.push(`${prefix}/redirect/index.html`);

  return bucket;
};

describe('S3SiteRemover', () => {
  beforeEach(() => {
    AWSMocks.mocks.S3.headBucket = () => ({ promise: () => Promise.resolve() });
  });

  after(() => {
    AWSMocks.resetMocks();
  });

  afterEach(() => nock.cleanAll());

  describe('.removeSite(site)', () => {
    it('should delete all objects in the `site/<org>/<repo>`, `demo/<org>/<repo>`, and `preview/<org>/<repo> directories', (done) => {
      const siteObjectsToDelete = [];
      const demoObjectsToDelete = [];
      const previewObjectsToDelete = [];

      let site;
      let objectsWereDeleted = false;
      let siteObjectsWereListed = false;
      let demoObjectWereListed = false;
      let previewObjectsWereListed = false;
      let objectsToDelete;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, cb) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        if (params.Prefix === `site/${site.owner}/${site.repository}/`) {
          siteObjectsWereListed = true;
          cb(null, mapSiteContents(siteObjectsToDelete));
        } else if (params.Prefix === `demo/${site.owner}/${site.repository}/`) {
          demoObjectWereListed = true;
          cb(null, mapSiteContents(demoObjectsToDelete));
        } else if (params.Prefix === `preview/${site.owner}/${site.repository}/`) {
          previewObjectsWereListed = true;
          cb(null, mapSiteContents(previewObjectsToDelete));
        }
      };


      AWSMocks.mocks.S3.deleteObjects = (params, cb) => {
        expect(params.Bucket).to.equal(config.s3.bucket);

        objectsToDelete = [
          ...siteObjectsToDelete,
          ...demoObjectsToDelete,
          ...previewObjectsToDelete,
          ...[
            `site/${site.owner}/${site.repository}`,
            `demo/${site.owner}/${site.repository}`,
            `preview/${site.owner}/${site.repository}`,
          ],
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

      factory.site().then((model) => {
        site = model;

        buildSiteObjects('site', site, siteObjectsToDelete);
        buildSiteObjects('demo', site, demoObjectsToDelete);
        buildSiteObjects('preview', site, previewObjectsToDelete);

        return S3SiteRemover.removeSite(site);
      }).then(() => {
        expect(siteObjectsWereListed).to.equal(true);
        expect(demoObjectWereListed).to.equal(true);
        expect(previewObjectsWereListed).to.equal(true);
        expect(objectsWereDeleted).to.equal(true);
        expect(objectsToDelete.length).to.equal(0);

        done();
      });
    });

    it('should delete robots.txt for a dedicated bucket', async () => {
      const siteObjects = [];

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, cb) => {
        cb(null, mapSiteContents(siteObjects));
      };

      const fakeDeleteObjects = sinon.stub();
      fakeDeleteObjects.yields(null, {});
      AWSMocks.mocks.S3.deleteObjects = fakeDeleteObjects;

      const site = await factory.site();
      site.s3ServiceName = 'foo-s3-service';
      site.awsBucketName = 'foo-s3-bucket';

      buildSiteObjects('site', site, siteObjects);
      await S3SiteRemover.removeSite(site);

      sinon.assert.calledTwice(fakeDeleteObjects);
      const firstCallParams = fakeDeleteObjects.firstCall.args[0];
      expect(firstCallParams.Delete.Objects).to.not.include({ Key: 'robots.txt' });

      const secondCallParams = fakeDeleteObjects.secondCall.args[0];
      expect(secondCallParams.Delete.Objects).to.deep.equal([{ Key: 'robots.txt' }]);
    });

    it('should delete objects in batches of 1000 at a time', (done) => {
      let deleteObjectsCallCount = 0;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, cb) => cb(null, {
        Contents: Array(750).fill(0).map(() => ({ Key: 'abc123' })),
      });

      AWSMocks.mocks.S3.deleteObjects = (params, cb) => {
        expect(params.Delete.Objects).to.have.length.at.most(1000);
        deleteObjectsCallCount += 1;
        cb();
      };

      factory.site()
        .then(site => S3SiteRemover.removeSite(site))
        .then(() => {
        // 750 site, 750 demo, 750 preview objects = 2250 total
        // 2250 objects means 3 groups of 1000
          expect(deleteObjectsCallCount).to.equal(3);
          done();
        });
    });

    it('should not delete anything if there is nothing to delete', (done) => {
      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, cb) => cb(null, {
        Contents: [],
      });

      AWSMocks.mocks.S3.deleteObjects = () => {
        // The site remover shouldn't delete anything,
        // Calling delete `deleteObjects` raises an error and fails the test.
        throw new Error('Attempted to delete objects when there should be none to delete');
      };

      factory.site()
        .then(site => S3SiteRemover.removeSite(site))
        .then(done)
        .catch(done);
    });

    it('should resolve if no bucket exists', (done) => {
      mockTokenRequest();
      apiNocks.mockDefaultCredentials(false);

      factory.site()
        .then(site => S3SiteRemover.removeSite(site))
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

      factory.site({
        s3ServiceName: s3Service,
        awsBucketName: routeName,
      }).then((model) => {
        site = model;

        return S3SiteRemover.removeInfrastructure(site);
      }).then((res) => {
        expect(res.metadata.guid).to.equal(s3Guid);
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

      factory.site({
        s3ServiceName: s3Service,
        awsBucketName: routeName,
      }).then((model) => {
        site = model;

        return S3SiteRemover.removeInfrastructure(site);
      })
        .then(done);
    });
  });
});
