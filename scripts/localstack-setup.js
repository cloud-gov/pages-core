const { S3Client, CreateBucketCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const moment = require('moment');
const { Op } = require('sequelize');

const {
  Build,
  BuildLog,
  BuildTask,
  Site,
} = require('../api/models');
const BuildLogs = require('../api/services/build-logs');

const config = require('../config');

const s3 = new S3Client({
  region: 'us-gov-west-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const cmd = new CreateBucketCommand({ Bucket: config.s3BuildLogs.bucket });
s3.send(cmd);

Site.findAll()
  .then((sites) => {
    sites.forEach(async (site) => {
      const siteCmd = new CreateBucketCommand({ Bucket: site.awsBucketName });
      await s3.send(siteCmd);
      const folders = ['preview', 'site', 'demo']
      folders.forEach((folder) => {
        const folderCmd = new PutObjectCommand({
          Bucket: site.awsBucketName,
          Key: `${folder}/${site.owner}/${site.repository}`,
        });
        s3.send(folderCmd);
      });
    });
  })
  .catch(err => console.error(err));

console.log('Uploading logs to S3');
async function archiveLogs() {
  const date = moment().subtract(3, 'days').startOf('day');

  const builds = await Build.findAll({
    attributes: ['id'],
    where: {
      completedAt: {
        [Op.lt]: date.toDate(),
      },
    },
  });

  console.log(`Found ${builds.length} builds.`);

  builds.forEach(build => BuildLogs.archiveBuildLogsForBuildId(build.id));
}

archiveLogs();
