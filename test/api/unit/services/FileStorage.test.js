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
const { FileStorageFile, FileStorageUserAction } = require('../../../../api/models');
const { SiteFileStorageSerivce } = require('../../../../api/services/file-storage');
const siteErrors = require('../../../../api/responses/siteErrors');

function testUserActionResults(results, fss) {
  return results.data.map((result) => {
    expect(typeof result.id).to.be.eq('number');
    expect(result.fileStorageServiceId).to.be.eq(fss.id);
    expect(typeof result.fileStorageFileId).to.be.eq('number');
    expect(typeof result.method).to.be.eq('string');
    expect(typeof result.description).to.be.eq('string');
    expect(typeof result.userId).to.be.eq('number');
    expect(typeof result.email).to.be.eq('string');
  });
}

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
          fileStorageServiceId: client.id,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(
        FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
      );
    });

    it('should prepend the root directory if not provided', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b/c';
      const name = 'another-directory';
      const key = path.join(client.S3_BASE_PATH, basepath, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.createDirectory(basepath, name);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.id,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}/`)).to.be.eq(true);
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
          fileStorageServiceId: client.id,
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
          fileStorageServiceId: client.id,
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
          fileStorageServiceId: client.id,
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
          fileStorageServiceId: client.id,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}`)).to.be.eq(true);
      expect(fsua).to.be.empty;
    });
  });

  describe('.deleteFile', () => {
    it('should delete a file by id', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const file = await factory.fileStorageFile.create({ fileStorageServiceId: fss.id });
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'deleteObject').resolves();

      const results = await client.deleteFile(file.id);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: file.id,
          method: FileStorageUserAction.METHODS.DELETE,
          description: FileStorageUserAction.ACTION_TYPES.DELETE_FILE,
        },
      });

      expect(fsua).to.not.be.empty;
      expect(s3stub.calledOnceWith(file.key)).to.be.eq(true);
      expect(results.id).to.be.eq(file.id);
      expect(results.name).to.be.eq(file.name);
      expect(results.description).to.be.eq(file.description);
      expect(results.key).to.be.eq(file.key);
      expect(results.type).to.be.eq(file.type);
      expect(results.metadata).to.be.eq(file.metadata);
      expect(results.deletedAt).to.be.not.null;
    });

    it('should return message if file is directory is not empty', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const baseDir = 'a/';
      const childDir = `${baseDir}b/`;
      const file = await factory.fileStorageFile.create({
        fileStorageServiceId: fss.id,
        type: 'directory',
        key: childDir,
      });

      // Other files/directories on the same level
      await factory.fileStorageFile.createBulk(fss.id, baseDir, {
        files: 10,
        directories: 2,
      });

      // Children files/directories
      await factory.fileStorageFile.createBulk(fss.id, childDir, {
        files: 10,
        directories: 2,
      });

      const results = await client.deleteFile(file.id);

      expect(results.message).to.be.eq(siteErrors.DIRECTORY_MUST_BE_EMPTIED);
    });

    it('should delete directory if empty', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const baseDir = 'a/';
      const childDir = `${baseDir}b/`;
      const file = await factory.fileStorageFile.create({
        fileStorageServiceId: fss.id,
        type: 'directory',
        key: childDir,
      });

      // Other files/directories on the same level
      await factory.fileStorageFile.createBulk(fss.id, baseDir, {
        files: 10,
        directories: 2,
      });
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'deleteObject').resolves();
      const results = await client.deleteFile(file.id);
      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: file.id,
          method: FileStorageUserAction.METHODS.DELETE,
          description: FileStorageUserAction.ACTION_TYPES.DELETE_FILE,
        },
      });

      expect(fsua).to.not.be.empty;
      expect(s3stub.calledOnceWith(file.key)).to.be.eq(true);
      expect(results.id).to.be.eq(file.id);
      expect(results.name).to.be.eq(file.name);
      expect(results.description).to.be.eq(file.description);
      expect(results.key).to.be.eq(file.key);
      expect(results.type).to.be.eq(file.type);
      expect(results.metadata).to.be.eq(file.metadata);
      expect(results.deletedAt).to.be.not.null;
    });

    it('should throw no file exists', async () => {
      const { client } = await createFileStorageServiceClient();
      const result = await client.deleteFile(123).catch((e) => e);

      expect(result).to.be.null;
    });

    it('should throw if file exist in other file storage service', async () => {
      const { client } = await createFileStorageServiceClient();
      const otherFss = await factory.fileStorageService.create();
      const otherFile = await factory.fileStorageFile.create({ fssId: otherFss.id });

      const result = await client.deleteFile(otherFile.id).catch((e) => e);

      expect(result).to.be.null;
    });
  });

  describe('.getFile', () => {
    it('should return a file by id', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const file = await factory.fileStorageFile.create({ fileStorageServiceId: fss.id });

      const results = await client.getFile(file.id);

      expect(results.id).to.be.eq(file.id);
      expect(results.name).to.be.eq(file.name);
      expect(results.description).to.be.eq(file.description);
      expect(results.key).to.be.eq(file.key);
      expect(results.type).to.be.eq(file.type);
      expect(results.metadata).to.be.eq(file.metadata);
    });

    it('should return empty if no file exists', async () => {
      const { client } = await createFileStorageServiceClient();
      const results = await client.getFile(123);
      expect(results).to.be.empty;
    });

    it('should return empty if file exist in other file storage service', async () => {
      const { client } = await createFileStorageServiceClient();
      const otherFss = await factory.fileStorageService.create();
      const otherFile = await factory.fileStorageFile.create({ fssId: otherFss.id });
      const results = await client.getFile(otherFile.id);

      expect(results).to.be.empty;
    });
  });

  describe('.listUserActions', () => {
    it('should list user actions for a file storage service', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const fileActions1 = await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: fss.id },
        10,
      );
      const fileActions2 = await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: fss.id },
        10,
      );
      const totalActionCount = fileActions1.length + fileActions2.length;

      const results = await client.listUserActions();

      testUserActionResults(results, fss);
      expect(results.data.length).to.be.eq(totalActionCount);
      expect(results.totalItems).to.be.eq(totalActionCount);
      expect(results.currentPage).to.be.eq(1);
      expect(results.totalPages).to.be.eq(1);
    });

    it('should list user actions for a file storage file', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const fileActions1 = await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: fss.id },
        10,
      );
      const fileStorageFileId = fileActions1[0].fileStorageFileId;
      await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: fss.id },
        5,
      );
      const totalActionCount = fileActions1.length;

      const results = await client.listUserActions({ fileStorageFileId });

      testUserActionResults(results, fss);
      expect(results.data.length).to.be.eq(totalActionCount);
      expect(results.totalItems).to.be.eq(totalActionCount);
      expect(results.currentPage).to.be.eq(1);
      expect(results.totalPages).to.be.eq(1);
    });

    it('should list user actions with limit 2 on page 2', async () => {
      const limit = 2;
      const page = 2;

      const { client, fss } = await createFileStorageServiceClient();
      const fileActions1 = await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: fss.id },
        10,
      );
      const fileStorageFileId = fileActions1[0].fileStorageFileId;
      await factory.fileStorageUserActions.createBulkRandom(
        { fileStorageServiceId: fss.id },
        5,
      );
      const totalActionCount = fileActions1.length;

      const results = await client.listUserActions({
        fileStorageFileId,
        limit,
        page,
      });

      testUserActionResults(results, fss);
      expect(results.data.length).to.be.eq(limit);
      expect(results.totalItems).to.be.eq(totalActionCount);
      expect(results.currentPage).to.be.eq(page);
      expect(results.totalPages).to.be.eq(totalActionCount / limit);
    });
  });

  describe('.listDirectoryFiles', () => {
    it('should list files in a directory', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const dir = path.join(client.S3_BASE_PATH, 'a/b/c/');
      const subdir = `${dir}/d/`;
      const expectedList = await factory.fileStorageFile.createBulk(fss.id, dir, {
        files: 10,
        directories: 2,
      });
      const expectedCount = expectedList.files.length + expectedList.directories.length;
      const unexpectedList = await factory.fileStorageFile.createBulk(fss.id, subdir, {
        files: 2,
        directories: 1,
      });
      const unexpectedCount =
        unexpectedList.files.length + unexpectedList.directories.length;
      const allFileCount = expectedCount + unexpectedCount;
      const results = await client.listDirectoryFiles(dir, { limit: 100 });

      const files = await FileStorageFile.findAll({
        where: { fileStorageServiceId: fss.id },
      });

      expect(results.currentPage).to.be.eq(1);
      expect(results.totalPages).to.be.eq(1);
      expect(results.data.length).to.be.eq(expectedCount);
      expect(results.totalItems).to.be.eq(expectedCount);
      expect(files.length).to.be.eq(allFileCount);
    });

    it('should list files in and prepend root directory', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const dir = 'a/b/c/';
      const subdir = `${dir}/d/`;
      const expectedList = await factory.fileStorageFile.createBulk(
        fss.id,
        // The prepended root directory
        `${client.S3_BASE_PATH}${dir}`,
        {
          files: 10,
          directories: 2,
        },
      );
      const expectedCount = expectedList.files.length + expectedList.directories.length;
      const unexpectedList = await factory.fileStorageFile.createBulk(
        fss.id,
        // The prepended root directory
        `${client.S3_BASE_PATH}${subdir}`,
        {
          files: 2,
          directories: 1,
        },
      );
      const unexpectedCount =
        unexpectedList.files.length + unexpectedList.directories.length;
      const allFileCount = expectedCount + unexpectedCount;
      const results = await client.listDirectoryFiles(dir, { limit: 100 });

      const files = await FileStorageFile.findAll({
        where: { fileStorageServiceId: fss.id },
      });

      expect(results.currentPage).to.be.eq(1);
      expect(results.totalPages).to.be.eq(1);
      expect(results.data.length).to.be.eq(expectedCount);
      expect(results.totalItems).to.be.eq(expectedCount);
      expect(files.length).to.be.eq(allFileCount);
    });

    it('should list files in a directory and not the parent directory', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const dir = path.join(client.S3_BASE_PATH, 'a/b/c/');
      const subdir = `${dir}/d/`;
      await factory.fileStorageFile.create({
        fileStorageServiceId: fss.id,
        type: 'directory',
        key: dir,
      });
      const expectedList = await factory.fileStorageFile.createBulk(fss.id, dir, {
        files: 10,
        directories: 2,
      });
      const expectedCount = expectedList.files.length + expectedList.directories.length;
      const unexpectedList = await factory.fileStorageFile.createBulk(fss.id, subdir, {
        files: 2,
        directories: 1,
      });
      const unexpectedCount =
        unexpectedList.files.length + unexpectedList.directories.length;
      const allFileCount = expectedCount + unexpectedCount + 1;
      const results = await client.listDirectoryFiles(dir, { limit: 100 });

      const files = await FileStorageFile.findAll({
        where: { fileStorageServiceId: fss.id },
      });

      expect(results.currentPage).to.be.eq(1);
      expect(results.totalPages).to.be.eq(1);
      expect(results.data.length).to.be.eq(expectedCount);
      expect(results.totalItems).to.be.eq(expectedCount);
      expect(files.length).to.be.eq(allFileCount);
    });

    it('should list files for directory on multiple pages', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const dir = path.join(client.S3_BASE_PATH, 'a/b/c/');
      const subdir = `${dir}/d/`;
      const limit = 2;
      const expectedList = await factory.fileStorageFile.createBulk(fss.id, dir, {
        files: 10,
        directories: 2,
      });
      const expectedCount = expectedList.files.length + expectedList.directories.length;
      const unexpectedList = await factory.fileStorageFile.createBulk(fss.id, subdir, {
        files: 2,
        directories: 1,
      });
      const unexpectedCount =
        unexpectedList.files.length + unexpectedList.directories.length;
      const allFileCount = expectedCount + unexpectedCount;
      const results = await client.listDirectoryFiles(dir, { limit });

      const files = await FileStorageFile.findAll({
        where: { fileStorageServiceId: fss.id },
      });

      const totalPages = expectedCount / limit;

      expect(results.currentPage).to.be.eq(1);
      expect(results.totalPages).to.be.eq(totalPages);
      expect(results.data.length).to.be.eq(limit);
      expect(results.totalItems).to.be.eq(expectedCount);
      expect(files.length).to.be.eq(allFileCount);
    });

    it('should list files for directory from second page', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const dir = path.join(client.S3_BASE_PATH, 'a/b/c/');
      const subdir = `${dir}/d/`;
      const limit = 2;
      const page = 2;
      const expectedList = await factory.fileStorageFile.createBulk(fss.id, dir, {
        files: 10,
        directories: 2,
      });
      const expectedCount = expectedList.files.length + expectedList.directories.length;
      const unexpectedList = await factory.fileStorageFile.createBulk(fss.id, subdir, {
        files: 2,
        directories: 1,
      });
      const unexpectedCount =
        unexpectedList.files.length + unexpectedList.directories.length;
      const allFileCount = expectedCount + unexpectedCount;
      const results = await client.listDirectoryFiles(dir, { limit, page });

      const files = await FileStorageFile.findAll({
        where: { fileStorageServiceId: fss.id },
      });

      const totalPages = expectedCount / limit;

      expect(results.currentPage).to.be.eq(page);
      expect(results.totalPages).to.be.eq(totalPages);
      expect(results.data.length).to.be.eq(limit);
      expect(results.totalItems).to.be.eq(expectedCount);
      expect(files.length).to.be.eq(allFileCount);
    });

    it('should sort by name desc', async () => {
      const { client, fss } = await createFileStorageServiceClient();
      const dir = path.join(client.S3_BASE_PATH, 'a/b/c/');
      const subdir = `${dir}/d/`;
      const order = [['name', 'desc']];
      const expectedList = await factory.fileStorageFile.createBulk(fss.id, dir, {
        files: 10,
        directories: 2,
      });
      const expectedCount = expectedList.files.length + expectedList.directories.length;
      const unexpectedList = await factory.fileStorageFile.createBulk(fss.id, subdir, {
        files: 2,
        directories: 1,
      });
      const unexpectedCount =
        unexpectedList.files.length + unexpectedList.directories.length;
      const allFileCount = expectedCount + unexpectedCount;
      const results = await client.listDirectoryFiles(dir, { order });

      const files = await FileStorageFile.findAll({
        where: { fileStorageServiceId: fss.id },
      });

      const firstRecordIncrement = parseInt(
        results.data[0].name.split('-').slice(-1)[0],
        10,
      );
      const secondRecordIncrement = parseInt(
        results.data[1].name.split('-').slice(-1)[0],
        10,
      );

      expect(firstRecordIncrement).to.be.gt(secondRecordIncrement);
      expect(results.currentPage).to.be.eq(1);
      expect(results.totalPages).to.be.eq(1);
      expect(results.data.length).to.be.eq(expectedCount);
      expect(results.totalItems).to.be.eq(expectedCount);
      expect(files.length).to.be.eq(allFileCount);
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
      const expectedKey = path.join(client.S3_BASE_PATH, parent, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.uploadFile(name, fileBuffer, type, parent, metadata);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.id,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith(fileBuffer, `${expectedKey}`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(FileStorageUserAction.ACTION_TYPES.UPLOAD_FILE);
    });

    it('should create a directory appended to the ~assets root', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const parent = '/a/b/c';
      const name = 'test.txt';
      const fileBuffer = Buffer.from('file content');
      const type = 'plain/txt';
      const metadata = { size: 123 };
      const expectedKey = path.join(client.S3_BASE_PATH, parent, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.uploadFile(name, fileBuffer, type, parent, metadata);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.id,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith(fileBuffer, `${expectedKey}`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(FileStorageUserAction.ACTION_TYPES.UPLOAD_FILE);
    });
  });
});
