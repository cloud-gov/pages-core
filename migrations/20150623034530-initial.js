const dbm = global.dbm || require('db-migrate');

const type = dbm.dataType;
const fs = require('fs');

const dropTable = (db, table) =>
  new Promise((resolve, reject) => {
    db.dropTable(table, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

exports.up = function (db, callback) {
  fs.readFile(`${__dirname}/initial.sql`, { encoding: 'utf-8' }, (err, data) => {
    if (err) throw err;
    db.runSql(data, () => {
      if (err) throw err;
      callback();
    });
  });
};

exports.down = function (db, callback) {
  db.runSql('DELETE FROM migrations', (err) => {
    dropTable(db, 'build')
      .then(() => dropTable(db, 'passport'))
      .then(() => dropTable(db, 'site'))
      .then(() => dropTable(db, 'site_users__user_sites'))
      .then(() => dropTable(db, 'user'))
      .then(() => {
        callback();
      })
      .catch((err) => callback(err));
  });
};
