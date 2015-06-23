var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;
var fs = require('fs');

exports.up = function(db, callback) {
  fs.readFile(__dirname + '/initial.sql', { encoding: 'utf-8' }, function(err, data) {
    if (err) throw err;
    console.log(data);
    db.runSql(data, function() {
      if (err) throw err;
      callback();
    });
  });
};

exports.down = function(db, callback) {
  db.runSql('drop schema public cascade; create schema public;', callback);
};
