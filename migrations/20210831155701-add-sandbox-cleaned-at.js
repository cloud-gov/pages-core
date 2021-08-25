const TABLE = 'organization';
const COLUMN = 'sandboxCleanedAt';
// const COLUMN = 'sandboxExpiredAt';

exports.up = db => db.addColumn(TABLE, COLUMN, { type: 'timestamp' });

exports.down = db => db.removeColumn(TABLE, COLUMN);
