const { expect } = require('chai');

const AWSMocks = require('../../support/aws-mocks');
const config = require('../../../../config');

const S3Helper = require('../../../../api/services/S3Helper');

describe('S3Helper', () => {
  describe('.listObjects(prefix)', () => {
    afterEach(() => {
      AWSMocks.resetMocks();
    });

    it('can get objects', (done) => {
      const prefix = 'some-prefix/';

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
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

      AWSMocks.mocks.S3.listObjectsV2 = (params, callback) => {
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

  describe('.putObject', () => {
    after(() => {
      AWSMocks.resetMocks();
    });

    it('should successfully put object in bucket', async () => {
      const body = 'Hello World';
      const key = 'hello.html';
      const extras = { ContentType: 'text/html' };

      const expected = {
        Bucket: config.s3.bucket,
        Body: body,
        Key: key,
        ...extras,
      };

      AWSMocks.mocks.S3.putObject = (params) => {
        expect(params).to.deep.equal(expected);
        return { promise: () => Promise.resolve() };
      };

      const client = new S3Helper.S3Client(config.s3);
      await client.putObject(body, key, extras);
    });

    it('should reject with promise', async () => {
      const body = 'Hello World';
      const key = 'hello.html';

      AWSMocks.mocks.S3.putObject = () => ({ promise: () => Promise.reject(new Error()) });

      const client = new S3Helper.S3Client(config.s3);
      const err = await client.putObject(body, key).catch(error => error);
      expect(err).to.be.an('error');
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
