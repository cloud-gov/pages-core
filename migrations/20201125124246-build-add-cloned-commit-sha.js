exports.up = (db, callback) =>
  db
    .addColumn('build', 'clonedCommitSha', { type: 'string' })
    .then(() => callback())
    .catch(callback);

exports.down = (db, callback) =>
  db
    .removeColumn('build', 'clonedCommitSha', callback)
    .then(() => callback())
    .catch(callback);
