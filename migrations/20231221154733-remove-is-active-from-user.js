const TABLE = 'user';

exports.up = async (db) => {
  await db.removeColumn(TABLE, 'isActive');
};

exports.down = async (db) => {
  await db.addColumn(TABLE, 'isActive', {
    type: 'boolean',
    notNull: true,
    defaultValue: true,
  });
  await db.runSql('update "user" set "isActive" = TRUE');
};
