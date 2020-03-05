const dbm = global.dbm || require('db-migrate');

const type = dbm.dataType;

exports.up = function (db, callback) {
  db.runSql('ALTER TABLE site ADD COLUMN domain text, ADD COLUMN config text', (err) => {
    if (err) throw err;
    callback();
  });
};

exports.down = function (db, callback) {
  db.runSql('ALTER TABLE site DROP COLUMN domain, DROP COLUMN config', (err) => {
    if (err) throw err;
    callback();
  });
};
