exports.up = (db, callback) => db.renameColumn('build', 'commitSha', 'requestedCommitSha')
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.renameColumn('build', 'requestedCommitSha', 'commitSha')
  .then(() => callback())
  .catch(callback);
