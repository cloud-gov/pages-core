const TABLE = 'user';
const COLUMN = 'adminEmail';
const INDEX = 'user_adminEmail_idx';

const CREATE_INDEX = `CREATE INDEX IF NOT EXISTS "${INDEX}" ON "${TABLE}" ("${COLUMN}") WHERE "${COLUMN}" IS NOT NULL;`;

exports.up = (db, callback) => db.addColumn(TABLE, COLUMN, { type: 'string' })
  .then(() => db.runSql(CREATE_INDEX))
  .then(() => callback())
  .catch(() => callback());
  
exports.down = (db, callback) => db.removeColumn(TABLE, COLUMN, callback);