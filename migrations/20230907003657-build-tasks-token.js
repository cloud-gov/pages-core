const TABLE = 'build_task';

exports.up = db => Promise.all([
  db.addColumn(TABLE, 'token', { type: 'string', allowNull: false }),
]);

exports.down = db => Promise.all([
  db.removeColumn(TABLE, 'token'),
]);

