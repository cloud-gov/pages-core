
const TABLE_NAME = "build_task";
const TABLE_INDEX_NAME = "build_task_build_id_type_index";

exports.up = async (db) => {
  await db.removeIndex(TABLE_NAME, TABLE_INDEX_NAME)
  await db.addIndex(TABLE_NAME, TABLE_INDEX_NAME, ["buildId", "buildTaskTypeId"], false);
};

exports.down = async (db) => {
  await db.addIndex(TABLE_NAME, TABLE_INDEX_NAME, ["buildId", "buildTaskTypeId"], true)
};

