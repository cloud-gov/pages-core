const TABLE = 'build';

exports.up = (db) => Promise.all([db.addColumn(TABLE, 'metrics', { type: 'jsonb' })]);

exports.down = (db) => Promise.all([db.removeColumn(TABLE, 'metrics')]);
