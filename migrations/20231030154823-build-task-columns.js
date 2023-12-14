const TABLE = 'build_task';

exports.up = db => Promise.all([
  db.addColumn(TABLE, 'message', { type: 'string' }),
  db.addColumn(TABLE, 'count', { type: 'int' } )
]);

exports.down = db => Promise.all([
  db.removeColumn(TABLE, 'message'),
  db.removeColumn(TABLE, 'count'),
]);
