exports.up = (db, callback) =>
  db.addColumn(
    'site',
    'buildStatus',
    {
      type: 'string',
    },
    callback,
  );

exports.down = (db, callback) => db.removeColumn('site', 'buildStatus', callback);
