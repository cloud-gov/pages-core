var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  var cmd = 'ALTER TABLE build ADD COLUMN "source" JSON';
  db.runSql(cmd, function(err) {
    if (err) throw err;
    callback();
  });

};

exports.down = function(db, callback) {
  var cmd = 'ALTER TABLE build DROP COLUMN "source"';
  db.runSql(cmd, function(err) {
    if (err) throw err;
    callback();
  });

};
