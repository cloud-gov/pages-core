const dbm = global.dbm || require('db-migrate');

const type = dbm.dataType;

exports.up = function (db, callback) {
  const cmd = 'ALTER TABLE build ADD COLUMN "source" JSON';
  db.runSql(cmd, (err) => {
    if (err) throw err;
    callback();
  });
};

exports.down = function (db, callback) {
  const cmd = 'ALTER TABLE build DROP COLUMN "source"';
  db.runSql(cmd, (err) => {
    if (err) throw err;
    callback();
  });
};
