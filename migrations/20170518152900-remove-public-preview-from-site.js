const dbm = global.dbm || require('db-migrate');

const type = dbm.dataType;

exports.up = function (db, callback) {
  db.removeColumn('site', 'publicPreview', callback);
};

exports.down = function (db, callback) {
  db.addColumn(
    'site',
    'publicPreview',
    {
      type: 'boolean',
      defaultValue: false,
    },
    callback,
  );
};
