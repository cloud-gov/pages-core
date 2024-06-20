const TABLE = 'build_task'
const COLUMN_NAME = 'siteBuildTaskId'
const COLUMN_TYPE = {
  type: "int",
  foreignKey: {
    name: "build_task_site_build_task_id_fk",
    table: "site_build_task",
    rules: {
      onDelete: "CASCADE",
      onUpdate: "RESTRICT"
    },
    mapping: "id"
  }
}

exports.up = async (db) => {
  await db.addColumn(TABLE, COLUMN_NAME, COLUMN_TYPE);
};

exports.down = async (db) => {
  await db.removeColumn(TABLE, COLUMN_NAME);
};
