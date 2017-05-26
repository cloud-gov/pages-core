var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.addColumn("user", "signedInAt", { type: "timestamp" }, callback)
};

exports.down = function(db, callback) {
  db.removeColumn("user", "signedInAt", callback)
};
