const dbm = global.dbm || require('db-migrate');

const type = dbm.dataType;
const Promise = require('bluebird');

const addPublishedAtColumn = (db) =>
  new Promise((resolve, reject) => {
    db.addColumn('site', 'publishedAt', { type: 'timestamp' }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

const fetchSiteIds = (db) =>
  new Promise((resolve, reject) => {
    db.all('SELECT id FROM site', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.map((row) => row.id));
      }
    });
  });

const fetchBuildCreatedAtForSite = (db, siteId) => {
  const sql = `
    SELECT "createdAt"
    FROM build
    WHERE site = ${siteId} AND state = 'success'
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return new Promise((resolve, reject) => {
    db.all(sql, (err, data) => {
      if (err) {
        reject(err);
      } else if (data.length === 0) {
        resolve();
      } else {
        resolve(data[0].createdAt);
      }
    });
  });
};

const setPublishedAtForSite = (db, siteId, publishedAt) => {
  const sql = `
    UPDATE site
    SET "publishedAt" = '${publishedAt.toISOString()}'
    WHERE id = ${siteId}
  `;

  return new Promise((resolve, reject) => {
    db.runSql(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.up = function (db, callback) {
  let siteIds;
  const buildCreatedAts = [];

  addPublishedAtColumn(db)
    .then(() => fetchSiteIds(db))
    .then((ids) => {
      siteIds = ids;
      return Promise.each(siteIds, (siteId) =>
        fetchBuildCreatedAtForSite(db, siteId).then((createdAt) =>
          buildCreatedAts.push(createdAt),
        ),
      );
    })
    .then(() =>
      Promise.each(siteIds, (siteId, index) => {
        const publishedAt = buildCreatedAts[index];
        if (publishedAt) {
          return setPublishedAtForSite(db, siteId, publishedAt);
        }
      }),
    )
    .then(() => {
      callback();
    })
    .catch(callback);
};

exports.down = function (db, callback) {
  db.removeColumn('site', 'publishedAt', callback);
};
