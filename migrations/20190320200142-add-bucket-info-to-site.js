const config = require('../config');

const dataType = {
  type: 'string',
};

const data = {
  instance: config.s3.instanceName || 'federalist-dev-s3',
  bucket: config.s3.bucket || 'cg-123456789',
  region: config.s3.region || 'us-gov-west-1',
};

const cmdCountRecords = 'SELECT count(*) from site;';
const cmdUpdateSiteRecords = `
  UPDATE
    site
  SET
    "cfInstanceName" = '${data.instance}',
    "awsBucketName" = '${data.bucket}',
    "awsBucketRegion" = '${data.region}'
  WHERE
    "cfInstanceName" IS NULL;
`;

const insertIfMissing = (db) => {
  db.runSql(cmdCountRecords)
    .then(res => res.rows[0].count)
    .then((count) => {
      if (count !== '0') db.runSql(cmdUpdateSiteRecords);
    });
};

exports.up = (db, callback) => db.addColumn('site', 'cfInstanceName', dataType)
  .then(() => db.addColumn('site', 'awsBucketName', dataType))
  .then(() => db.addColumn('site', 'awsBucketRegion', dataType))
  .then(() => insertIfMissing(db))
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.removeColumn('site', 'cfInstanceName')
  .then(() => db.removeColumn('site', 'awsBucketName'))
  .then(() => db.removeColumn('site', 'awsBucketRegion'))
  .then(() => callback())
  .catch(callback);
