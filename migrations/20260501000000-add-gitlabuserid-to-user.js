const TABLE_NAME = 'user';
const GITLAB_USER_ID = 'gitlabUserId';
const GITLAB_USER_ID_COLUMN_TYPE = {
  type: 'text',
  allowNull: true,
};

exports.up = async (db) => {
  await db.addColumn(TABLE_NAME, GITLAB_USER_ID, GITLAB_USER_ID_COLUMN_TYPE);
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, GITLAB_USER_ID);
};
