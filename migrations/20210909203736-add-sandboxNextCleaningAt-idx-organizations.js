const TABLE = 'organization';
const COLUMN = 'sandboxNextCleaningAt';
const INDEX = 'organization_sandboxNextCleaningAt_idx';

const CREATE_INDEX = `CREATE INDEX IF NOT EXISTS "${INDEX}" ON "${TABLE}" ("${COLUMN}") WHERE "${COLUMN}" IS NOT NULL;`;
const DROP_INDEX = `DROP INDEX IF EXISTS "${INDEX}";`;

exports.up = (db, callback) => db.runSql(CREATE_INDEX)
  .then(() => callback())
  .catch(() => callback());
  
exports.down = (db, callback) => db.runSql(DROP_INDEX)
  .then(() => callback())
  .catch(() => callback());
