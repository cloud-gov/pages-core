const dbm = global.dbm || require('db-migrate');

const type = dbm.dataType;

exports.up = function (db, callback) {
  db.addColumn('site', 'demoDomain', { type: 'string' }, (err) => {
    if (err) {
      callback(err);
    } else {
      db.addColumn('site', 'demoBranch', { type: 'string' }, callback);
    }
  });
};

exports.down = function (db, callback) {
  db.removeColumn('site', 'demoDomain', (err) => {
    if (err) {
      callback(err);
    } else {
      db.removeColumn('site', 'demoBranch', callback);
    }
  });
};
