exports.up = (db, callback) =>
  db.addColumn('build', 'url', {
    type: 'string',
  }, callback);

exports.down = (db, callback) =>
  db.removeColumn('build', 'url', callback);
