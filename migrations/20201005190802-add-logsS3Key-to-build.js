exports.up = (db, callback) =>
  db.addColumn('build', 'logsS3Key', { type: 'string' }, callback);

exports.down = (db, callback) => db.removeColumn('build', 'logsS3Key', callback);
