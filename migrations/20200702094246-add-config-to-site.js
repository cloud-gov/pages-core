exports.up = (db, callback) =>
  db.addColumn(
    'site',
    'config',
    {
      type: 'jsonb',
      defaultValue: '{}',
    },
    callback,
  );

exports.down = (db, callback) => db.removeColumn('site', 'config', callback);
