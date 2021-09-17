const TABLE = 'organization';
const COLUMN = 'sandboxNextCleaningAt';

exports.up = db => db.addColumn(TABLE, COLUMN, { type: 'timestamp' });

exports.down = db => db.removeColumn(TABLE, COLUMN);
