const TABLE = 'site';
const COLUMN = 'webhookId';

exports.up = db => db.addColumn(TABLE, COLUMN, { type: 'int' });

exports.down = db => db.removeColumn(TABLE, COLUMN);