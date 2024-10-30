exports.up = (db, callback) =>
  db.addColumn(
    'user_action',
    'siteId',
    {
      type: 'int',
      allowNull: false,
    },
    callback,
  );

exports.down = (db, callback) => db.removeColumn('user_action', 'siteId', callback);
