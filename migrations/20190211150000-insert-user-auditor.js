module.exports.up = (db, callback) =>
  db.insert(
    'user',
    ['username', 'createdAt', 'updatedAt'],
    ['federalist', new Date(), new Date()],
    callback,
  );

module.exports.down = (db, callback) => callback();
// db.runSql('delete from "user" where username=\'federalist\'', callback);
