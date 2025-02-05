const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { expect } = require('chai');
const sinon = require('sinon');
const factory = require('../../support/factory');
const {
  stubFileStorageClient,
  createFileStorageServiceClient,
} = require('../../support/file-storage-service');
const EventCreator = require('../../../../api/services/EventCreator');
const S3Helper = require('../../../../api/services/S3Helper');
const { FileStorageUserAction } = require('../../../../api/models');
const { SiteFileStorageSerivce } = require('../../../../api/services/file-storage');

describe('FileStorage services', () => {
  beforeEach(async () =>
    Promise.all([
      sinon.stub(EventCreator, 'error').resolves(),
      await factory.organization.truncate(),
    ]),
  );

  afterEach(async () =>
    Promise.all([sinon.restore(), await factory.organization.truncate()]),
  );

  describe('SiteFileStorageSerivce', () => {
    it('should initialize with proper s3 creds', async () => {
      const {
        fss,
        org,
        site,
        access_key_id,
        bucket,
        region,
        secret_access_key,
        instance1,
        user,
      } = await stubFileStorageClient();

      const siteStorageService = new SiteFileStorageSerivce(fss, user.id);
      const client = await siteStorageService.createClient();

      expect(client.access_key_id).to.be.eq(access_key_id);
      expect(client.bucket).to.be.eq(bucket);
      expect(client.region).to.be.eq(region);
      expect(client.secret_access_key).to.be.eq(secret_access_key);
      expect(client.serviceName).to.be.eq(site.s3ServiceName);
      expect(client.id).to.be.eq(fss.id);
      expect(client.organizationId).to.be.eq(org.id);
      expect(client.serviceInstance).to.be.eq(instance1);
      expect(client.s3Client).to.be.instanceOf(S3Helper.S3Client);
    });

    it('should throw with invalid s3 service', async () => {
      const message = 'Error occured';
      const expected = Error(message);
      const { fss } = await stubFileStorageClient({
        fetchServiceInstanceRejects: expected,
      });

      const siteStorageService = new SiteFileStorageSerivce(fss);
      const error = await siteStorageService.createClient().catch((e) => e);

      expect(error).to.be.throw;
      expect(error.message).to.be.eq(message);
    });

    it('should throw with invalid s3 credentials', async () => {
      const message = 'Error occured';
      const expected = Error(message);
      const { fss } = await stubFileStorageClient({
        fetchCredentialsRejects: expected,
      });

      const siteStorageService = new SiteFileStorageSerivce(fss);
      const error = await siteStorageService.createClient().catch((e) => e);

      expect(error).to.be.throw;
      expect(error.message).to.be.eq(message);
    });
  });

  describe('createDirectory', () => {
    it('should create a directory with a name and path', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b/c';
      const name = 'another-directory/';
      const key = path.join(client.S3_BASE_PATH, basepath, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.createDirectory(basepath, name);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(
        FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
      );
    });

    it('should append trailing slash if not provided', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b/c';
      const name = 'another-directory';
      const key = path.join(client.S3_BASE_PATH, basepath, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.createDirectory(basepath, name);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}/`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(
        FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
      );
    });

    it('should normalize the path', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b///c';
      const name = 'another-directory///';
      const key = path.join(client.S3_BASE_PATH, basepath, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.createDirectory(basepath, name);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(
        FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
      );
    });

    it('should slugify the directory name', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b///c';
      const name = 'another directory';
      const slugified = 'another-directory';
      const key = path.join(client.S3_BASE_PATH, basepath, slugified, '/');
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.createDirectory(basepath, name);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(
        FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
      );
    });

    it('error when the directory name is too long', async () => {
      const { client } = await createFileStorageServiceClient();
      const basepath = '/a/b///c';
      const name = randomBytes(101).toString('hex').slice(0, 201);
      const errorMessage = 'Text must be less than or equal to 200 characters.';

      const error = await client.createDirectory(basepath, name).catch((e) => e);

      expect(error).to.be.throw;
      expect(error.message).to.be.eq(errorMessage);
    });

    it('error when the directory name is not string or number', async () => {
      const { client } = await createFileStorageServiceClient();
      const basepath = '/a/b///c';
      const name = { hello: 'world' };
      const errorMessage = 'Text must be a string or number.';

      const error = await client.createDirectory(basepath, name).catch((e) => e);

      expect(error).to.be.throw;
      expect(error.message).to.be.eq(errorMessage);
    });

    it('should not create a file or user action on s3 error', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b/c';
      const name = 'another-directory/';
      const key = path.join(client.S3_BASE_PATH, basepath, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').rejects();

      const error = await client.createDirectory(basepath, name).catch((e) => e);

      expect(error).to.be.throw;

      const fsua = await FileStorageUserAction.findAll({
        where: {
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}`)).to.be.eq(true);
      expect(fsua).to.be.empty;
    });
  });

  describe('uploadFile', () => {
    it('should create a directory with a name and path', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const parent = '/a/b/c';
      const name = 'test.txt';
      const fileBuffer = Buffer.from('file content');
      const type = 'plain/txt';
      const metadata = { size: 123 };
      const key = path.join(client.S3_BASE_PATH, parent, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.uploadFile(name, fileBuffer, type, parent, metadata);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith(fileBuffer, `${key}`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(FileStorageUserAction.ACTION_TYPES.UPLOAD_FILE);
    });
  });
});
