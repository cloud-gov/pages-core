const TABLE_NAME = 'user';
const GITLAB_TOKEN = 'gitlabToken';
const GITLAB_REFRESH_TOKEN = 'gitlabRefreshToken';
const GITLAB_EXPIRES_AT = 'gitlabExpiresAt';
const TOKEN_COLUMN_TYPE = {
  type: 'text',
  allowNull: true,
};
const EXPIRES_AT_COLUMN_TYPE = {
  type: 'timestamp',
  allowNull: true,
};

exports.up = async (db) => {
  await db.addColumn(TABLE_NAME, GITLAB_TOKEN, TOKEN_COLUMN_TYPE);
  await db.addColumn(TABLE_NAME, GITLAB_REFRESH_TOKEN, TOKEN_COLUMN_TYPE);
  await db.addColumn(TABLE_NAME, GITLAB_EXPIRES_AT, EXPIRES_AT_COLUMN_TYPE);
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, GITLAB_TOKEN);
  await db.removeColumn(TABLE_NAME, GITLAB_REFRESH_TOKEN);
  await db.removeColumn(TABLE_NAME, GITLAB_EXPIRES_AT);
};
