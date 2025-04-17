const dbm = global.dbm || require('db-migrate');

const type = dbm.dataType;

exports.up = function (db, callback) {
  db.runSql('DROP INDEX IF EXISTS site_subdomain_unique', (err) => {
    if (err) throw err;
    callback();
  });
};

exports.down = function (db, callback) {
  db.runSql(
    'CREATE UNIQUE INDEX site_subdomain_unique ON site (subdomain) WHERE "deletedAt" IS NULL',
    (err) => {
      if (err) throw err;
      callback();
    },
  );
};
