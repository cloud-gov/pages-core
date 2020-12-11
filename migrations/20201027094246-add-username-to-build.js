exports.up = (db, callback) => db.addColumn('build', 'username', { type: 'string' })
  .then(() => db.runSql('update build set username = "user".username from "user" where build.user = "user".id;'))
  .then(() => db.changeColumn('build', 'username', { notNull: true }))
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.removeColumn('build', 'username', callback);
