var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.addColumn("build", "commitSha", { type: "string" }, callback)
};

exports.down = function(db, callback) {
  db.removeColumn("build", "commitSha", callback)
};
