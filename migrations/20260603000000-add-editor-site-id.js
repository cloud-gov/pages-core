const TABLE_NAME = 'site';
const EDITOR_SITE_ID = 'editorSiteId';
const EDITOR_SITE_ID_COLUMN_TYPE = {
  type: 'int',
  allowNull: true,
};

exports.up = async (db) => {
  await db.addColumn(TABLE_NAME, EDITOR_SITE_ID, EDITOR_SITE_ID_COLUMN_TYPE);
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, EDITOR_SITE_ID);
};
