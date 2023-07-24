const TABLE_NAME = "site_branch_config";
const TABLE_INDEX_NAME = "site_branch_config_unique_site_id_branch_index";
const TABLE_SCHEMA = {
  id: { type: "int", primaryKey: true, autoIncrement: true },
  siteId: {
    type: "int",
    notNull: true,
    foreignKey: {
      name: "site_branch_config_site_id_fk",
      table: "site",
      rules: {
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      mapping: "id",
    },
  },
  branch: { type: "string", allowNull: true },
  s3Key: { type: "string", allowNull: true },
  config: { type: "jsonb", allowNull: true },
  context: { type: "string", default: "preview", notNull: true },
  createdAt: { type: "timestamp", notNull: true },
  updatedAt: { type: "timestamp", notNull: true },
  deletedAt: { type: "timestamp", allowNull: true },
};

const SELECT_SITE_CONFIGS = `
  SELECT
    id,
    owner,
    repository,
    "defaultBranch",
    "demoBranch",
    "defaultConfig",
    "demoConfig",
    "previewConfig"
  FROM
    site
  WHERE
    "deletedAt" IS NULL;
`;

const insertSiteConfig = async (
  db,
  { siteId, branch = null, config = null, context = "preview", s3Key = null }
) => {
  const configValue = config ? `'${JSON.stringify(config)}'` : null;
  const branchValue = branch ? `'${branch}'` : null;
  const contextValue = context ? `'${context}'` : `'preview'`;
  const s3KeyValue = s3Key ? `'${s3Key}'` : null;

  const sql = `
    INSERT INTO site_branch_config
      ("siteId", branch, config, context, "s3Key", "createdAt", "updatedAt")
    VALUES
      (${siteId}, ${branchValue}, ${configValue}, ${contextValue}, ${s3KeyValue}, now(), now());
  `;

  return await db.runSql(sql);
};

exports.up = async (db) => {
  await db.createTable(TABLE_NAME, TABLE_SCHEMA);
  await db.addIndex(TABLE_NAME, TABLE_INDEX_NAME, ["siteId", "branch"], true);
  const { rows: sites } = await db.runSql(SELECT_SITE_CONFIGS);

  const migrated = sites.map(async (site) => {
    const {
      id: siteId,
      owner,
      repository,
      defaultBranch,
      demoBranch,
      defaultConfig,
      demoConfig,
      previewConfig,
    } = site;

    if (defaultBranch) {
      await insertSiteConfig(db, {
        siteId,
        branch: defaultBranch,
        s3Key: `/site/${owner}/${repository}`,
        config: defaultConfig,
        context: "site",
      });
    }

    if (demoBranch) {
      await insertSiteConfig(db, {
        siteId,
        branch: demoBranch,
        s3Key: `/demo/${owner}/${repository}`,
        config: demoConfig,
        context: "demo",
      });
    }

    if (previewConfig) {
      await insertSiteConfig(db, { siteId, config: previewConfig });
    }
  });

  console.log(`Migrated ${migrated.length} sites.`);
};

exports.down = (db) => db.dropTable(TABLE_NAME);
