const dataType = {
  type: 'string',
};

const data = {
  serviceName: 'cf-s3-site-service-name',
  bucket: 's3-bucket-name',
  region: 'us-gov-west-1',
};

const cmdCountRecords = 'SELECT count(*) from site;';
const cmdUpdateSiteRecords = `
  UPDATE
    site
  SET
    "s3ServiceName" = '${data.serviceName}',
    "awsBucketName" = '${data.bucket}',
    "awsBucketRegion" = '${data.region}'
  WHERE
    "s3ServiceName" IS NULL;
`;

const insertIfMissing = (db) => {
  db.runSql(cmdCountRecords)
    .then(res => res.rows[0].count)
    .then((count) => {
      if (count !== '0') db.runSql(cmdUpdateSiteRecords);
    });
};

exports.up = (db, callback) => db.addColumn('site', 's3ServiceName', dataType)
  .then(() => db.addColumn('site', 'awsBucketName', dataType))
  .then(() => db.addColumn('site', 'awsBucketRegion', dataType))
  .then(() => insertIfMissing(db))
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.removeColumn('site', 's3ServiceName')
  .then(() => db.removeColumn('site', 'awsBucketName'))
  .then(() => db.removeColumn('site', 'awsBucketRegion'))
  .then(() => callback())
  .catch(callback);
