exports.up = (db, callback) =>
  db.addColumn(
    'site',
    'deletedAt',
    {
      type: 'date',
      allowNull: true,
    },
    callback,
  );

exports.down = (db, callback) => db.removeColumn('site', 'deletedAt', callback);
