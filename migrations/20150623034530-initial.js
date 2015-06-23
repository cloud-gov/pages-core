var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;
var Sails = require('sails');

exports.up = function(db, callback) {
  Sails.lift({
    models: {
      connection: 'postgres',
      migrate: 'alter'
    },
    hooks: {
      grunt: false,
      http: false,
      pubsub: false,
      sockets: false,
      views: false
    }
  }, function(err, sails) {
    if (err) throw err;
    sails.lower(callback);
  });
};

exports.down = function(db, callback) {
  db.runSql('drop schema public cascade; create schema public;', callback);
};
