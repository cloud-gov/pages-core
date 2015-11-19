var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  var cmd = 'ALTER TABLE site ADD COLUMN "publicPreview" BOOLEAN DEFAULT FALSE';
  db.runSql(cmd, function(err) {
    if (err) throw err;
    callback();
  });
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE site DROP COLUMN "publicPreview"', function(err) {
    if (err) throw err;
    callback();
  });
};
