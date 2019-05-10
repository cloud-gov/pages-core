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

  describe('.putBucketWebsite', () => {
    after(() => {
      AWSMocks.resetMocks();
    });

    it('should successfully send params to bucket', (done) => {
      const owner = 'an-owner';
      const repository = 'a-reposistory';
      const expected = {
        Bucket: config.s3.bucket,
        WebsiteConfiguration: {
          ErrorDocument: {
            Key: `site/${owner}/${repository}/404/index.html`,
          },
          IndexDocument: {
            Suffix: 'index.html',
          },
        },
      };

      AWSMocks.mocks.S3.putBucketWebsite = (params, callback) => {
        expect(params).to.deep.equal(expected);
        callback(null, null);
      };

      const client = new S3Helper.S3Client(config.s3);
      client.putBucketWebsite(owner, repository)
        .then(done)
        .catch(done);
    });

    it('should reject with promise', function specialTest(done) {
      this.timeout(10000);

      AWSMocks.mocks.S3.putBucketWebsite = (params, callback) => {
        callback(new Error());
      };

      const client = new S3Helper.S3Client(config.s3);
      client.putBucketWebsite()
        .catch((err) => {
          expect(err).to.be.an('error');
          done();
        });
    });
  });

  describe('.putObject', () => {
    after(() => {
      AWSMocks.resetMocks();
    });

    it('should successfully put object in bucket', (done) => {
      const body = 'Hello World';
      const key = 'hello.html';
      const expected = {
        Bucket: config.s3.bucket,
        Body: body,
        Key: key,
      };

      AWSMocks.mocks.S3.putObject = (params, callback) => {
        expect(params).to.deep.equal(expected);
        callback(null, null);
      };

      const client = new S3Helper.S3Client(config.s3);
      client.putObject(body, key)
        .then(done)
        .catch(done);
    });

    it('should reject with promise', (done) => {
      const body = 'Hello World';
      const key = 'hello.html';

      AWSMocks.mocks.S3.putObject = (params, callback) => {
        callback(new Error());
      };

      const client = new S3Helper.S3Client(config.s3);
      client.putObject(body, key)
        .catch((err) => {
          expect(err).to.be.an('error');
          done();
        });
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
