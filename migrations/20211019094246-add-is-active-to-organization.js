const TABLE = 'organization';
const INDEX = 'organization_is_active_idx';
const COLUMN = 'isActive';

exports.up = async (db) => {
  await db.addColumn(TABLE, COLUMN, {
    type: 'boolean',
    notNull: true,
    defaultValue: true,
  });
  await db.addIndex(TABLE, INDEX, [COLUMN]);
};

exports.down = async (db) => {
  await db.removeIndex(TABLE, INDEX);
  await db.removeColumn(TABLE, COLUMN);
};
