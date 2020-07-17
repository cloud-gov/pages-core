const nock = require('nock');
const { expect } = require('chai');

const AWSMocks = require('../../support/aws-mocks');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const factory = require('../../support/factory');
const config = require('../../../../config');
const S3PublishedFileLister = require('../../../../api/services/S3PublishedFileLister');

describe('S3PublishedFileLister', () => {
  after(() => {
    AWSMocks.resetMocks();
  });

  afterEach(() => nock.cleanAll());

  describe('.listPublishedPreviews(site)', () => {
    it('should resolve with a list of published previews for the given site', (done) => {
      let site;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        expect(params.Prefix).to.equal(`preview/${site.owner}/${site.repository}/`);
        expect(params.Delimiter).to.equal('/');
        callback(null, {
          IsTruncated: false,
          Contents: [],
          CommonPrefixes: [
            { Prefix: `preview/${site.owner}/${site.repository}/abc/` },
            { Prefix: `preview/${site.owner}/${site.repository}/def/` },
            { Prefix: `preview/${site.owner}/${site.repository}/ghi/` },
          ],
        });
      };

      factory.site().then((model) => {
        site = model;
        return S3PublishedFileLister.listPublishedPreviews(site);
      }).then((publishedPreviews) => {
        expect(publishedPreviews).to.deep.equal(['abc', 'def', 'ghi']);
        done();
      }).catch(done);
    });

    it('responds with the appropriate error when s3 keys are invalid', (done) => {
      const expected = 'S3 keys out of date. Update them with `npm run update-local-config`';
      let site;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
        callback({ status: 403, code: 'InvalidAccessKeyId' }, null);
      };

      factory.site()
        .then((model) => {
          site = model;
          return S3PublishedFileLister.listPublishedPreviews(site);
        })
        .catch((error) => {
          expect(error.message).to.equal(expected);
          done();
        });
    });
  });

  describe('.listPagedPublishedFilesForBranch(site, branch)', () => {
    it("should resolve with a list of files for the site's default branch", (done) => {
      let site;
      let prefix;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        expect(params.Prefix).to.equal(prefix);

        callback(null, {
          IsTruncated: false,
          Contents: [
            { Key: `${prefix}abc`, Size: 123 },
            { Key: `${prefix}abc/def`, Size: 456 },
            { Key: `${prefix}ghi`, Size: 789 },
          ],
        });
      };

      factory.site({ defaultBranch: 'main' }).then((model) => {
        site = model;
        prefix = `site/${site.owner}/${site.repository}/`;
        return S3PublishedFileLister.listPagedPublishedFilesForBranch(site, 'main');
      }).then((publishedFiles) => {
        expect(publishedFiles).to.deep.equal({
          isTruncated: false,
          files: [
            { name: 'abc', size: 123, key: `${prefix}abc` },
            { name: 'abc/def', size: 456, key: `${prefix}abc/def` },
            { name: 'ghi', size: 789, key: `${prefix}ghi` },
          ],
        });
        done();
      }).catch(done);
    });

    it("should resolve with a list of files for the site's demo branch", (done) => {
      let site;
      let prefix;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        expect(params.Prefix).to.equal(prefix);

        callback(null, {
          IsTruncated: false,
          Contents: [
            { Key: `${prefix}abc`, Size: 123 },
            { Key: `${prefix}abc/def`, Size: 456 },
            { Key: `${prefix}ghi`, Size: 789 },
          ],
        });
      };

      factory.site({ demoBranch: 'demo-branch-name' }).then((model) => {
        site = model;
        prefix = `demo/${site.owner}/${site.repository}/`;
        return S3PublishedFileLister.listPagedPublishedFilesForBranch(site, 'demo-branch-name');
      }).then((publishedFiles) => {
        expect(publishedFiles).to.deep.equal({
          isTruncated: false,
          files: [
            { name: 'abc', size: 123, key: `${prefix}abc` },
            { name: 'abc/def', size: 456, key: `${prefix}abc/def` },
            { name: 'ghi', size: 789, key: `${prefix}ghi` },
          ],
        });
        done();
      }).catch(done);
    });

    it('should resolve with a list of files for a preview branch', (done) => {
      let site;
      let prefix;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        expect(params.Prefix).to.equal(prefix);

        callback(null, {
          IsTruncated: false,
          Contents: [
            { Key: `${prefix}abc`, Size: 123 },
            { Key: `${prefix}abc/def`, Size: 456 },
            { Key: `${prefix}ghi`, Size: 789 },
          ],
        });
      };

      factory.site({ defaultBranch: 'main' }).then((model) => {
        site = model;
        prefix = `preview/${site.owner}/${site.repository}/preview/`;
        return S3PublishedFileLister.listPagedPublishedFilesForBranch(site, 'preview');
      }).then((publishedFiles) => {
        expect(publishedFiles).to.deep.equal({
          isTruncated: false,
          files: [
            { name: 'abc', size: 123, key: `${prefix}abc` },
            { name: 'abc/def', size: 456, key: `${prefix}abc/def` },
            { name: 'ghi', size: 789, key: `${prefix}ghi` },
          ],
        });
        done();
      }).catch(done);
    });

    it('should reject with an error if S3.listObjectsV2 is unsuccessful', (done) => {
      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      AWSMocks.mocks.S3.listObjectsV2 = (params, cb) => cb(new Error('Test error'));

      factory.site()
        .then(site => S3PublishedFileLister.listPagedPublishedFilesForBranch(site, 'preview'))
        .catch((err) => {
          expect(err.message).to.equal('Test error');
          done();
        })
        .catch(done);
    });
  });
});
