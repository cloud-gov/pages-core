var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;
var fs = require('fs');

const dropTable = (db, table) => {
  return new Promise((resolve, reject) => {
    db.dropTable(table, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

exports.up = function(db, callback) {
  fs.readFile(__dirname + '/initial.sql', { encoding: 'utf-8' }, function(err, data) {
    if (err) throw err;
    db.runSql(data, function() {
      if (err) throw err;
      callback();
    });
  });
};

exports.down = function(db, callback) {
  db.runSql("DELETE FROM migrations", (err) => {
    dropTable(db, "build").then(() => {
      return dropTable(db, "passport")
    }).then(() => {
      return dropTable(db, "site")
    }).then(() => {
      return dropTable(db, "site_users__user_sites")
    }).then(() => {
      return dropTable(db, "user")
    }).then(() => {
      callback()
    }).catch(err => callback(err))
  })
};
