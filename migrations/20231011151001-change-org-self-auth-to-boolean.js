const TABLE = 'organization';

exports.up = async (db) => {
  await db.addColumn(TABLE, 'isSelfAuthorized', {
    type: 'boolean',
    notNull: true,
    defaultValue: false,
  });
  await db.runSql(
    'update "organization" set "isSelfAuthorized" = TRUE where "selfAuthorizedAt" is not null',
  );
  await db.removeColumn(TABLE, 'selfAuthorizedAt');
};

exports.down = async (db) => {
  await db.addColumn(TABLE, 'selfAuthorizedAt', {
    type: 'timestamp',
    allowNull: true,
  });
  await db.runSql(
    'update "organization" set "selfAuthorizedAt" = CURRENT_DATE where "isSelfAuthorized" IS TRUE',
  );
  await db.removeColumn(TABLE, 'isSelfAuthorized');
};
