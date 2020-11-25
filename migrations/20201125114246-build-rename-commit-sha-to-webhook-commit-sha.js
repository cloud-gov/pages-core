exports.up = (db, callback) => db.renameColumn('build', 'commitSha', 'webhookCommitSha')
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.renameColumn('build', 'webhookCommitSha', 'commitSha')
  .then(() => callback())
  .catch(callback);
