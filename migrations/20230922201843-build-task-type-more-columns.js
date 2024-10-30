const TABLE = 'build_task_type';

exports.up = (db) =>
  Promise.all([
    db.addColumn(TABLE, 'runner', {
      type: 'string',
      allowNull: false,
    }),
    db.addColumn(TABLE, 'startsWhen', {
      type: 'string',
      allowNull: true,
    }),
  ]);

exports.down = (db) =>
  Promise.all([db.removeColumn(TABLE, 'runner'), db.removeColumn(TABLE, 'startsWhen')]);
