const TABLE = 'organization';

exports.up = db => Promise.all([
  db.addColumn(TABLE, 'agency', { type: 'string', allowNull: true }),
  db.addColumn(TABLE, 'selfAuthorizedAt', { type: 'timestamp', allowNull: true }),
]);

exports.down = db => Promise.all([
  db.removeColumn(TABLE, 'agency'),
  db.removeColumn(TABLE, 'selfAuthorizedAt'),
]);
