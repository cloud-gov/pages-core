exports.up = (db, callback) => db.addColumn('user', 'committedAt', { type: 'timestamp' })
  .then(() => db.runSql('update "user" set "user".committedAt = b."committedAt" from (select username, max("createdAt") "comittedAt" from build group by username) b where "user".username = b.username'))
  .then(() => callback());

exports.down = (db, callback) => db.removeColumn('user', 'committedAt', callback);
