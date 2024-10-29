exports.up = (db, callback) =>
  db.createTable(
    'buildlog',
    {
      id: {
        type: 'int',
        primaryKey: true,
        autoIncrement: true,
      },
      output: 'string',
      source: 'string',
      build: 'int',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
    },
    callback,
  );

exports.down = (db, callback) => db.dropTable('buildlog', callback);
