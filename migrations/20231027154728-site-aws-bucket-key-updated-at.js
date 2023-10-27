const TABLE = 'site';
const COLUMN_NAME = 'awsBucketKeyUpdatedAt';
const COLUMN_TYPE = {
  type: 'timestamp',
  notNull: true,
  defaultValue: new String('now()'),
};

exports.up = async (db) => {
  await db.addColumn(TABLE, COLUMN_NAME, COLUMN_TYPE);
};

exports.down = async (db) => {
  await db.removeColumn(TABLE, COLUMN_NAME);
};
