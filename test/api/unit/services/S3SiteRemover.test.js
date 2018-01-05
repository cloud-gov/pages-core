const AWSMocks = require('../../support/aws-mocks');
const expect = require('chai').expect;
const factory = require('../../support/factory');
const config = require('../../../../config');

const S3SiteRemover = require('../../../../api/services/S3SiteRemover');

describe('S3SiteRemover', () => {
  after(() => {
    AWSMocks.resetMocks();
  });

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

      AWSMocks.mocks.S3.listObjectsV2 = (params, cb) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        if (params.Prefix === `site/${site.owner}/${site.repository}`) {
          siteObjectsWereListed = true;
          cb(null, {
            Contents: siteObjectsToDelete.map(Key => ({ Key })),
          });
        } else if (params.Prefix === `demo/${site.owner}/${site.repository}`) {
          demoObjectWereListed = true;
          cb(null, {
            Contents: demoObjectsToDelete.map(Key => ({ Key })),
          });
        } else if (params.Prefix === `preview/${site.owner}/${site.repository}`) {
          previewObjectsWereListed = true;
          cb(null, {
            Contents: previewObjectsToDelete.map(Key => ({ Key })),
          });
        }
      };
      AWSMocks.mocks.S3.deleteObjects = (params, cb) => {
        expect(params.Bucket).to.equal(config.s3.bucket);

        const objectsToDelete = [
          ...siteObjectsToDelete,
          ...demoObjectsToDelete,
          ...previewObjectsToDelete,
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

        const sitePrefix = `site/${site.owner}/${site.repository}`;
        siteObjectsToDelete.push(`${sitePrefix}/index.html`);
        siteObjectsToDelete.push(`${sitePrefix}/redirect`);
        siteObjectsToDelete.push(`${sitePrefix}/redirect/index.html`);
        const demoPrefix = `demo/${site.owner}/${site.repository}`;
        demoObjectsToDelete.push(`${demoPrefix}/index.html`);
        demoObjectsToDelete.push(`${demoPrefix}/redirect`);
        demoObjectsToDelete.push(`${demoPrefix}/redirect/index.html`);
        const previewPrefix = `preview/${site.owner}/${site.repository}`;
        previewObjectsToDelete.push(`${previewPrefix}/index.html`);
        previewObjectsToDelete.push(`${previewPrefix}/redirect`);
        previewObjectsToDelete.push(`${previewPrefix}/redirect/index.html`);

        return S3SiteRemover.removeSite(site);
      }).then(() => {
        expect(siteObjectsWereListed).to.equal(true);
        expect(demoObjectWereListed).to.equal(true);
        expect(previewObjectsWereListed).to.equal(true);
        expect(objectsWereDeleted).to.equal(true);
        done();
      }).catch(done);
    });

    it('should delete objects in batches of 1000 at a time', (done) => {
      let deleteObjectsCallCount = 0;

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
      })
      .catch(done);
    });

    it('should not delete anything if there is nothing to delete', (done) => {
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
  });
});
