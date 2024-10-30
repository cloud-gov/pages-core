exports.up = (db, callback) =>
  db.addIndex('buildlog', 'buildlog_build_idx', ['build'], callback);

exports.down = (db, callback) =>
  db.removeIndex('buildlog', 'buildlog_build_idx', callback);
