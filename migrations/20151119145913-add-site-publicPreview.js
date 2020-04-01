const dbm = global.dbm || require('db-migrate');

const type = dbm.dataType;

exports.up = function (db, callback) {
  const cmd = 'ALTER TABLE site ADD COLUMN "publicPreview" BOOLEAN DEFAULT FALSE';
  db.runSql(cmd, (err) => {
    if (err) throw err;
    callback();
  });
};

exports.down = function (db, callback) {
  db.runSql('ALTER TABLE site DROP COLUMN "publicPreview"', (err) => {
    if (err) throw err;
    callback();
  });
};
