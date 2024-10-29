const { expect } = require('chai');

const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const config = require('../../../../config');

const S3Helper = require('../../../../api/services/S3Helper');

const s3Mock = mockClient(S3Client);

describe('S3Helper', () => {
  after(() => s3Mock.restore());
  beforeEach(() => s3Mock.reset());

  describe('.listHelper(prefix, property)', () => {
    it("returns an empty array if the prefix doesn't exist", (done) => {
      const prefix = 'nonexistant-prefix/';

      s3Mock
        .on(ListObjectsV2Command, {
          Bucket: config.s3.bucket,
          Prefix: prefix,
        })
        .resolvesOnce({
          IsTruncated: false,
          KeyCount: 0,
          ContinuationToken: null,
          NextContinuationToken: null,
        });

      const client = new S3Helper.S3Client(config.s3);
      client
        .listObjects(prefix)
        .then((objects) => {
          expect(objects.length).to.equal(0);
          done();
        })
        .catch(done);
    });
  });

  describe('.listObjects(prefix)', () => {
    it('can get objects', (done) => {
      const prefix = 'some-prefix/';

      s3Mock
        .on(ListObjectsV2Command, {
          Bucket: config.s3.bucket,
          Prefix: prefix,
        })
        .resolvesOnce({
          IsTruncated: false,
          KeyCount: 3,
          Contents: ['a', 'b', 'c'],
          ContinuationToken: null,
          NextContinuationToken: null,
        });

      const client = new S3Helper.S3Client(config.s3);
      client
        .listObjects(prefix)
        .then((objects) => {
          expect(objects).to.deep.equal(['a', 'b', 'c']);
          done();
        })
        .catch(done);
    });

    it('can get all objects when initial response is truncated', (done) => {
      const prefix = 'abc/123/';

      s3Mock
        .on(ListObjectsV2Command, {
          Bucket: config.s3.bucket,
          Prefix: prefix,
        })
        .resolvesOnce({
          IsTruncated: true,
          KeyCount: 3,
          Contents: [1, 2, 3],
          ContinuationToken: 'first-token',
          NextContinuationToken: 'next-token',
        })
        .resolvesOnce({
          IsTruncated: true,
          KeyCount: 3,
          Contents: [4, 5, 6],
          ContinuationToken: 'next-token',
          NextContinuationToken: 'last-token',
        })
        .resolvesOnce({
          IsTruncated: true,
          KeyCount: 3,
          Contents: [7, 8, 9],
          ContinuationToken: 'last-token',
          NextContinuationToken: null,
        });

      const client = new S3Helper.S3Client(config.s3);
      client
        .listObjects(prefix)
        .then((objects) => {
          expect(objects).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          done();
        })
        .catch(done);
    });
  });

  describe('.deleteAllBucketObjects()', () => {
    it('should delete all objects in the S3 bucket', async () => {
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
          KeyCount: objectsToDelete.length,
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

      const client = new S3Helper.S3Client(config.s3);

      await client.deleteAllBucketObjects();
      expect(deletionBucket).to.equal(config.s3.bucket);
      expect(deletedObjects.length).to.equal(objectsToDelete.length);
      expect(deletedObjects).to.have.deep.members(
        objectsToDelete.map((object) => ({
          Key: object,
        })),
      );
    });
  });

  describe('.putObject', () => {
    it('should successfully put object in bucket', async () => {
      const body = 'Hello World';
      const key = 'hello.html';
      const extras = {
        ContentType: 'text/html',
      };

      const expected = {
        Bucket: config.s3.bucket,
        Body: body,
        Key: key,
        ...extras,
      };

      s3Mock.on(PutObjectCommand, expected).resolves();

      const client = new S3Helper.S3Client(config.s3);
      await client.putObject(body, key, extras);
    });

    it('should reject with promise', async () => {
      const body = 'Hello World';
      const key = 'hello.html';

      s3Mock.on(PutObjectCommand).rejects();

      const client = new S3Helper.S3Client(config.s3);
      const err = await client.putObject(body, key).catch((error) => error);
      expect(err).to.be.an('error');
    });
  });

  describe('.getObject', () => {
    it('should successfully get object from bucket', async () => {
      const body = 'Hello World';
      const key = 'hello.html';
      const extras = {
        ContentType: 'text/html',
      };

      const expected = {
        Bucket: config.s3.bucket,
        Key: key,
        ...extras,
      };

      s3Mock.on(GetObjectCommand, expected).resolves({
        Body: body,
      });

      const client = new S3Helper.S3Client(config.s3);
      const result = await client.getObject(key, extras);
      expect(result.Body).to.equal(body);
    });
  });

  describe('.listCommonPrefixes(prefix)', () => {
    it('can get common prefixes', (done) => {
      const prefix = 'some-prefix/';

      s3Mock
        .on(ListObjectsV2Command, {
          Bucket: config.s3.bucket,
          Prefix: prefix,
        })
        .resolvesOnce({
          IsTruncated: false,
          KeyCount: 3,
          CommonPrefixes: ['a', 'b', 'c'],
          ContinuationToken: null,
          NextContinuationToken: null,
        });

      const client = new S3Helper.S3Client(config.s3);
      client
        .listCommonPrefixes(prefix)
        .then((objects) => {
          expect(objects).to.deep.equal(['a', 'b', 'c']);
          done();
        })
        .catch(done);
    });

    it('can get all common prefixes when initial response is truncated', (done) => {
      const prefix = 'abc/123/';

      s3Mock
        .on(ListObjectsV2Command, {
          Bucket: config.s3.bucket,
          Prefix: prefix,
        })
        .resolvesOnce({
          IsTruncated: true,
          KeyCount: 3,
          CommonPrefixes: [1, 2, 3],
          ContinuationToken: 'first-token',
          NextContinuationToken: 'next-token',
        })
        .resolvesOnce({
          IsTruncated: true,
          KeyCount: 3,
          CommonPrefixes: [4, 5, 6],
          ContinuationToken: 'next-token',
          NextContinuationToken: 'last-token',
        })
        .resolvesOnce({
          IsTruncated: true,
          KeyCount: 3,
          CommonPrefixes: [7, 8, 9],
          ContinuationToken: 'last-token',
          NextContinuationToken: null,
        });

      const client = new S3Helper.S3Client(config.s3);
      client
        .listCommonPrefixes(prefix)
        .then((objects) => {
          expect(objects).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          done();
        })
        .catch(done);
    });
  });

  describe('.listObjectsPaged(prefix, maxObjects, startAfter)', () => {});
});
