exports.up = (db, callback) => db.addColumn('user', 'isActive', { type: 'boolean', notNull: true, defaultValue: true })
  .then(() => db.runSql('update "user" set "isActive" = TRUE'))
  .then(() => callback());

exports.down = (db, callback) => db.removeColumn('user', 'isActive', callback);
