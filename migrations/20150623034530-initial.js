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
  var q = async.queue(db.dropTable.bind(db));
  q.drain = callback;

  db.runSql('DELETE FROM migrations', function(err) {
    if (err) throw err;
    q.push('build');
    q.push('passport');
    q.push('site');
    q.push('site_users__user_sites');
    q.push('user');
  });

};
