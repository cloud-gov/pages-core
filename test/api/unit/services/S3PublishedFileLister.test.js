const nock = require('nock');
const { expect } = require('chai');

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const factory = require('../../support/factory');
const S3PublishedFileLister = require('../../../../api/services/S3PublishedFileLister');

const s3Mock = mockClient(S3Client);

describe('S3PublishedFileLister', () => {
  after(() => s3Mock.restore());
  afterEach(() => nock.cleanAll());
  beforeEach(() => s3Mock.reset());

  describe('.listPublishedPreviews(site)', () => {
    it('should resolve with a list of published previews for the given site', (done) => {
      let site;

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      factory.site().then((model) => {
        site = model;

        s3Mock.on(ListObjectsV2Command).resolvesOnce({
          IsTruncated: true,
          CommonPrefixes: [
            { Prefix: `preview/${site.owner}/${site.repository}/abc/` },
            { Prefix: `preview/${site.owner}/${site.repository}/def/` },
            { Prefix: `preview/${site.owner}/${site.repository}/ghi/` },
          ],
          ContinuationToken: 'A',
          NextContinuationToken: null,
        });

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

      s3Mock.on(ListObjectsV2Command).rejects({
        code: 'InvalidAccessKeyId',
      });

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

      factory.site({ defaultBranch: 'main' }).then((model) => {
        site = model;
        prefix = `site/${site.owner}/${site.repository}/`;

        s3Mock.on(ListObjectsV2Command).resolvesOnce({
          IsTruncated: true,
          Contents: [
            { Key: `${prefix}abc`, Size: 123 },
            { Key: `${prefix}abc/def`, Size: 456 },
            { Key: `${prefix}ghi`, Size: 789 },
          ],
          ContinuationToken: 'A',
          NextContinuationToken: 'B',
        }).resolvesOnce({
          IsTruncated: false,
          Contents: [

          ],
          ContinuationToken: 'B',
          NextContinuationToken: null,
        });

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

      factory.site({ demoBranch: 'demo-branch-name' }).then((model) => {
        site = model;
        prefix = `demo/${site.owner}/${site.repository}/`;

        s3Mock.on(ListObjectsV2Command).resolvesOnce({
          IsTruncated: true,
          Contents: [
            { Key: `${prefix}abc`, Size: 123 },
            { Key: `${prefix}abc/def`, Size: 456 },
            { Key: `${prefix}ghi`, Size: 789 },
          ],
          ContinuationToken: 'A',
          NextContinuationToken: 'B',
        }).resolvesOnce({
          IsTruncated: false,
          Contents: [

          ],
          ContinuationToken: 'B',
          NextContinuationToken: null,
        });

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

      factory.site({ defaultBranch: 'main' }).then((model) => {
        site = model;
        prefix = `preview/${site.owner}/${site.repository}/preview/`;

        s3Mock.on(ListObjectsV2Command).resolvesOnce({
          IsTruncated: true,
          Contents: [
            { Key: `${prefix}abc`, Size: 123 },
            { Key: `${prefix}abc/def`, Size: 456 },
            { Key: `${prefix}ghi`, Size: 789 },
          ],
          ContinuationToken: 'A',
          NextContinuationToken: 'B',
        }).resolvesOnce({
          IsTruncated: false,
          Contents: [

          ],
          ContinuationToken: 'B',
          NextContinuationToken: null,
        });

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

      s3Mock.on(ListObjectsV2Command).rejects('Test error');

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
