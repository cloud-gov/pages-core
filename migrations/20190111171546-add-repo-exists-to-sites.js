exports.up = (db, callback) =>
  db.addColumn(
    'site',
    'repoLastVerified',
    {
      type: 'timestamp',
    },
    callback,
  );

exports.down = (db, callback) => db.removeColumn('site', 'repoLastVerified', callback);
