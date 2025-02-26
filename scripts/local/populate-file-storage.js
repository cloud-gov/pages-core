const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');
const { ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { FileStorageFile, FileStorageUserAction } = require('../../api/models');
const S3Helper = require('../../api/services/S3Helper');
const { slugify } = require('../../api/utils');

class SeedFileStorage {
  constructor(fileStorageServiceId, userId, bucket) {
    this.fileStorageServiceId = fileStorageServiceId;
    this.userId = userId;
    this.bucket = bucket;
    this.s3 = new S3Helper.S3Client({
      accessKeyId: process.env.MINIO_ROOT_USER,
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
      bucket,
      region: 'auto',
    });
  }

  async seedFileStorage(dirArray, parent = '.') {
    return Promise.all(
      dirArray.map(async (item) => {
        if (item.type === 'directory') {
          const key = path.join(parent, item.name);
          await this.createDirectory(item.name, key);

          if (item?.children?.length > 0) {
            return this.seedFileStorage(item.children, key);
          }
        }

        if (item.type === 'generated') {
          const promises = Array.from({ length: item.number }, () =>
            this.generateFile(parent),
          );

          return Promise.all(promises);
        }

        if (item.type === 'file') {
          const filePath = path.join(__dirname, item.path);
          const file = await fs.readFile(filePath);
          const key = path.join(parent, slugify(item.name));
          const fileStat = await fs.stat(filePath);
          const ext = path.extname(filePath);
          const type = this.#getMimeType(ext);
          const metadata = { size: fileStat.size };

          return this.createFile(item.name, file, type, key, metadata);
        }
      }),
    );
  }

  async createDirectory(name, key) {
    const dirBuffer = Buffer.from('');
    await this.s3.putObject(dirBuffer, key);

    const fsf = await FileStorageFile.create({
      name,
      key,
      type: 'directory',
      fileStorageServiceId: this.fileStorageServiceId,
      description: 'directory',
    });

    await FileStorageUserAction.create({
      userId: this.userId,
      fileStorageServiceId: this.fileStorageServiceId,
      fileStorageFileId: fsf.id,
      method: FileStorageUserAction.METHODS.POST,
      description: FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
    });
  }

  async createFile(name, fileBuffer, type, key, metadata = {}) {
    await this.s3.putObject(fileBuffer, key);

    const fsf = await FileStorageFile.create({
      name,
      key,
      type: type,
      metadata,
      fileStorageServiceId: this.fileStorageServiceId,
    });

    await FileStorageUserAction.create({
      userId: this.userId,
      fileStorageServiceId: this.fileStorageServiceId,
      fileStorageFileId: fsf.id,
      method: FileStorageUserAction.METHODS.POST,
      description: FileStorageUserAction.ACTION_TYPES.UPLOAD_FILE,
    });

    return fsf;
  }

  async generateFile(parent) {
    const name = this.#generateRandomString(10);
    const fileName = `${name}.txt`;
    const type = 'text/plain';
    const key = path.join(parent, fileName);
    const fileBuffer = this.#generateRandomString(500);
    const size = this.#generateRandomNumber(10000, 100000);
    const metadata = {
      size,
    };

    await this.createFile(fileName, fileBuffer, type, key, metadata);
  }

  #generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  #generateRandomString(len) {
    return crypto.randomBytes(len).toString('hex').slice(0, len);
  }

  #getMimeType(ext) {
    if (ext === 'pdf') 'application/pdf';
    if (ext === 'png') return 'image/png';

    return 'application/octet-stream';
  }
}

async function runFileStorageSeed(fileStorageServiceId, userId, bucket, fileStructure) {
  const seed = new SeedFileStorage(fileStorageServiceId, userId, bucket);

  await seed.seedFileStorage(fileStructure);
}

async function cleanFileStorage(bucket) {
  const s3 = new S3Helper.S3Client({
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
    bucket,
    region: 'auto',
  });

  async function emptyBucket() {
    try {
      // Step 1: List objects in the bucket
      const listParams = {
        Bucket: bucket,
      };

      const listedObjects = await s3.client.send(new ListObjectsV2Command(listParams));

      if (!listedObjects.Contents) {
        return;
      }

      if (listedObjects?.Contents?.length === 0) {
        return;
      }

      // Step 2: Prepare objects for deletion
      const objectsToDelete = listedObjects.Contents.map((object) => ({
        Key: object.Key,
      }));

      // Step 3: Delete objects
      const deleteParams = {
        Bucket: bucket,
        Delete: {
          Objects: objectsToDelete,
          Quiet: false,
        },
      };

      await s3.client.send(new DeleteObjectsCommand(deleteParams));

      // If there are more objects, you may need to repeat the process
      if (listedObjects.IsTruncated) {
        await emptyBucket(); // Recursively call to delete all objects
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error emptying bucket:', err);
    }
  }

  await emptyBucket();
}

module.exports = { cleanFileStorage, runFileStorageSeed, SeedFileStorage };
