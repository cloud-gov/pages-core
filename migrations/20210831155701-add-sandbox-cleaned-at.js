const TABLE = 'organization';
const COLUMN = 'sandboxCleanedAt';

exports.up = db => db.addColumn(TABLE, COLUMN, { type: 'timestamp' });

exports.down = db => db.removeColumn(TABLE, COLUMN);
