var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;
var Sails = require('sails');

exports.up = function(db, callback) {
  Sails.lift({
    models: {
      connection: 'postgres',
      migrate: 'alter'
    }
  }, function(err, sails) {
    if (err) throw err;
    setTimeout(sails.lower.bind(this, callback), 0);
  });
};

exports.down = function(db, callback) {
  callback();
};
