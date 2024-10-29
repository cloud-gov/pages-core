exports.up = (db, callback) =>
  db.addColumn(
    'user',
    'deletedAt',
    {
      type: 'date',
      allowNull: true,
    },
    callback,
  );

exports.down = (db, callback) => db.removeColumn('user', 'deletedAt', callback);
