exports.up = (db, callback) => db.addColumn('build', 'username', { type: 'string' })
  .then(() => db.runSql('update build set username = "user".username from "user" where build.user = "user".id;'))
  .then(() => db.removeColumn('build', 'user'))
  .then(() => callback())
  .catch(callback);

exports.down = (db, callback) => db.addColumn('build', 'user', { type: 'int' })
  .then(() => db.runSql(`update build set "user" = "user".id from "user" where build.username = "user".username;`))
  .then(() => db.removeColumn('build', 'username'))
  .then(() => callback())
  .catch(callback);
