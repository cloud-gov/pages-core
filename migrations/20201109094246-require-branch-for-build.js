exports.up = (db, callback) => db.changeColumn('build', 'branch', { notNull: true })
  .then(() => callback());


exports.down = (db, callback) => db.removeColumn('build', 'branch', { allowNull: true })
  .then(() => callback());

