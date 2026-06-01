const TABLE_NAME = 'build';
const IS_EDITOR_SITE_BUILD = 'isEditorSiteBuild';
const IS_EDITOR_SITE_BUILD_COLUMN_TYPE = {
  type: 'boolean',
  allowNull: true,
};

exports.up = async (db) => {
  await db.addColumn(TABLE_NAME, IS_EDITOR_SITE_BUILD, IS_EDITOR_SITE_BUILD_COLUMN_TYPE);
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, IS_EDITOR_SITE_BUILD);
};
