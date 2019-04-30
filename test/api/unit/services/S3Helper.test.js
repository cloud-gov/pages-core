const { expect } = require('chai');

const AWSMocks = require('../../support/aws-mocks');
const config = require('../../../../config');

const S3Helper = require('../../../../api/services/S3Helper');

const S3Mocks = AWSMocks.mocks.S3;

describe('S3Helper', () => {
  describe('.listObjects(prefix)', () => {
    after(() => {
      AWSMocks.resetMocks();
    });

    it('can get objects', (done) => {
      const prefix = 'some-prefix/';

      S3Mocks.listObjectsV2 = (params, callback) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        expect(params.Prefix).to.equal(prefix);

        callback(null, {
          Contents: ['a', 'b', 'c'],
        });
      };

      const client = new S3Helper.S3Client(config.s3);
      client.listObjects(prefix)
        .then((objects) => {
          expect(objects).to.deep.equal(['a', 'b', 'c']);
          done();
        })
        .catch(done);
    });

    it('can get all objects when initial response is truncated', (done) => {
      const prefix = 'abc/123/';

      S3Mocks.listObjectsV2 = (params, callback) => {
        expect(params.Bucket).to.equal(config.s3.bucket);
        expect(params.Prefix).to.equal(prefix);

        // Simulate conditions that require calling recursively
        if (!params.ContinuationToken) { // first-call
          callback(null, {
            Contents: [1, 2, 3],
            IsTruncated: true,
            NextContinuationToken: 'next-token',
          });
        } else if (params.ContinuationToken === 'next-token') {
          callback(null, {
            Contents: [4, 5, 6],
            IsTruncated: true,
            NextContinuationToken: 'last-token',
          });
        } else if (params.ContinuationToken === 'last-token') {
          callback(null, {
            Contents: [7, 8, 9],
            IsTruncated: false,
          });
        }
      };

      const client = new S3Helper.S3Client(config.s3);
      client.listObjects(prefix)
        .then((objects) => {
          expect(objects).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          done();
        })
        .catch(done);
    });
  });

  describe('.listCommonPrefixes(prefix)', () => {
    after(() => {
      AWSMocks.resetMocks();
    });
  });

  describe('.listObjectsPaged(prefix, maxObjects, startAfter)', () => {
    after(() => {
      AWSMocks.resetMocks();
    });
  });
});
