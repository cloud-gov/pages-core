
const TYPE_TABLE_NAME = "build_task_type";
const TYPE_TABLE_SCHEMA = {
  id: { type: "int", primaryKey: true, autoIncrement: true },
  name: { type: "string", notNull: true },
  description: { type: "string", notNull: true },
  metadata: { type: "jsonb", allowNull: true },
  createdAt: { type: "timestamp", notNull: true },
  updatedAt: { type: "timestamp", notNull: true },
};

const TABLE_NAME = "build_task";
const TABLE_INDEX_NAME = "build_task_build_id_type_index";
const TABLE_SCHEMA = {
  id: { type: "int", primaryKey: true, autoIncrement: true },
  buildId: {
    type: "int",
    notNull: true,
    foreignKey: {
      name: "build_task_build_id_fk",
      table: "build",
      rules: {
        onDelete: "CASCADE",
        onUpdate: "RESTRICT"
      },
      mapping: "id"
    }
  },
  buildTaskTypeId: {
    type: "int",
    notNull: true,
    foreignKey: {
      name: "build_task_build_task_type_id_fk",
      table: "build_task_type",
      rules: {
        onDelete: "CASCADE",
        onUpdate: "RESTRICT"
      },
      mapping: "id"
    }
  },
  name: { type: "string", notNull: true },
  status: { type: "string", notNull: true, default: "created" },
  artifact: { type: "string", allowNull: true },
  createdAt: { type: "timestamp", notNull: true },
  updatedAt: { type: "timestamp", notNull: true },
  deletedAt: { type: "timestamp", allowNull: true },
};

const SITE_TABLE_NAME = "site_build_task";
const SITE_TABLE_SCHEMA = {
  id: { type: "int", primaryKey: true, autoIncrement: true },
  siteId: {
    type: "int",
    notNull: true,
    foreignKey: {
      name: "site_build_task_site_id_fk",
      table: "site",
      rules: {
        onDelete: "CASCADE",
        onUpdate: "RESTRICT"
      },
      mapping: "id"
    }
  },
  buildTaskTypeId: {
    type: "int",
    notNull: true,
    foreignKey: {
      name: "site_build_task_build_task_type_id_fk",
      table: "build_task_type",
      rules: {
        onDelete: "CASCADE",
        onUpdate: "RESTRICT"
      },
      mapping: "id"
    }
  },
  branch: { type: "string", allowNull: true },
  metadata: { type: "jsonb", allowNull: true },
  createdAt: { type: "timestamp", notNull: true },
  updatedAt: { type: "timestamp", notNull: true },
  deletedAt: { type: "timestamp", allowNull: true },
};


exports.up = async (db) => {
  await db.createTable(TYPE_TABLE_NAME, TYPE_TABLE_SCHEMA);
  await db.createTable(SITE_TABLE_NAME, SITE_TABLE_SCHEMA);
  await db.createTable(TABLE_NAME, TABLE_SCHEMA)
  await db.addIndex(TABLE_NAME, TABLE_INDEX_NAME, ["buildId", "buildTaskTypeId"], true);
};

exports.down = async (db) => {
  await db.dropTable(TABLE_NAME);
  await db.dropTable(SITE_TABLE_NAME);
  return db.dropTable(TYPE_TABLE_NAME);
};

