exports.up = (db, callback) => db.addColumn('build', 'cloneCommitSha', { type: 'string' })
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.removeColumn('build', 'username', callback)
  .then(() => callback())
  .catch(callback);
