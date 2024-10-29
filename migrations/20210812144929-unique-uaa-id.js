const TABLE = 'uaa_identity';
const COLUMN = 'userId';
const INDEX_NAME = `${TABLE}_${COLUMN}_key`;

exports.up = async (db) => db.addIndex(TABLE, INDEX_NAME, [COLUMN], true);

exports.down = async (db) => db.removeIndex(TABLE, INDEX_NAME);
