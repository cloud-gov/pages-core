exports.up = (db, callback) => db.addColumn('user', 'pushedAt', { type: 'timestamp' })
  .then(() => db.runSql('update "user" set "pushedAt" = b."pushedAt" from (select username, max("createdAt") "pushedAt" from build group by username) b where "user".username = b.username'))
  .then(() => callback());

exports.down = (db, callback) => db.removeColumn('user', 'pushedAt', callback);
