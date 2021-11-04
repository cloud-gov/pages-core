const TABLE = 'site';
const NEW_COLUMN = 'isActive';
const OLD_COLUMN = 'buildStatus';

exports.up = async db => {
  await db.addColumn(TABLE, NEW_COLUMN, { type: 'boolean', notNull: true, defaultValue: true });
  await db.runSql(`UPDATE ${TABLE} SET "${NEW_COLUMN}" = false WHERE "${OLD_COLUMN}" = 'inactive'`);
  await db.removeColumn(TABLE, OLD_COLUMN);
};

exports.down = async db => {
  await db.addColumn(TABLE, OLD_COLUMN, { type: 'string', notNull: true, defaultValue: 'active' });
  await db.runSql(`UPDATE ${TABLE} SET "${OLD_COLUMN}" = 'inactive' WHERE "${NEW_COLUMN}" = false`);
  await db.removeColumn(TABLE, NEW_COLUMN);
};
