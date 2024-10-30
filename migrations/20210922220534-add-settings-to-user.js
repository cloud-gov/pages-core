const TABLE = 'user';
const COLUMN = 'settings';

exports.up = (db) =>
  db.addColumn(TABLE, COLUMN, {
    type: 'jsonb',
    defaultValue: '{}',
  });

exports.down = (db) => db.removeColumn(TABLE, COLUMN);
