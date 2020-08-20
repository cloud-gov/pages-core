exports.up = (db, callback) => db.addColumn('build', 'startedAt', {
  type: 'timestamp',
}, callback);

exports.down = (db, callback) => db.removeColumn('build', 'startedAt', callback);
