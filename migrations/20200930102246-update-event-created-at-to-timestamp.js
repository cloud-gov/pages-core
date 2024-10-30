exports.up = (db, callback) =>
  db.changeColumn(
    'event',
    'createdAt',
    {
      type: 'timestamp',
    },
    callback,
  );

exports.down = (db, callback) =>
  db.changeColumn(
    'event',
    'createdAt',
    {
      type: 'date',
    },
    callback,
  );
