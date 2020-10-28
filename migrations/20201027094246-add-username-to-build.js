exports.up = (db, callback) => db.addColumn('build', 'username', { type: 'string', notNull: true })
  .then(() => db.runSql(`update build set build.username = user.username from "user" where build.user = "user".id;`))
  .then(() => db.removeColumn('build', 'user'))
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.addColumn('build', 'user', { type: 'int', notNull: true })
  .then(() => db.runSql(`update build set build.user = "user".id from "user" where build.username = "user".username;`))
  .then(() => db.removeColumn('build', 'username'))
  .then(() => callback())
  .catch(callback);
