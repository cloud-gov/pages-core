var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;
var fs = require('fs');
var async = require('sails/node_modules/async');

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
  async.series([
    db.dropTable.bind(db, 'build'),
    db.dropTable.bind(db, 'passport'),
    db.dropTable.bind(db, 'site'),
    db.dropTable.bind(db, 'site_users__user_sites'),
    db.dropTable.bind(db, 'user')
  ], callback);
};
