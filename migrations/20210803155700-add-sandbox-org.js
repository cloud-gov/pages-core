const TABLE = 'organization';
const COLUMN = 'isSandbox';

exports.up = (db) =>
  db.addColumn(TABLE, COLUMN, {
    type: 'boolean',
    notNull: true,
    defaultValue: false,
  });

exports.down = (db) => db.removeColumn(TABLE, COLUMN);
