const TABLE_NAME = 'domain';
const COLUMN_NAME = 'siteBranchConfigId';
const FOREIGN_KEY_NAME = 'domain_site_branch_config_id_fk';

const COLUMN_INTERIM_SPEC = {
  type: 'int',
  notNull: false,
  foreignKey: {
    name: FOREIGN_KEY_NAME,
    table: 'site_branch_config',
    rules: {
      onDelete: 'CASCADE',
      onUpdate: 'RESTRICT',
    },
    mapping: 'id',
  },
};
const COLUMN_FINAL_SPEC = { ...COLUMN_INTERIM_SPEC, notNull: true };

const SELECT_DOMAINS = `
SELECT
  id,
  "siteId",
  context
FROM
  domain
WHERE
  "deletedAt" IS NULL;
`;

const getSBCQuery = (siteId, context) => {
  return `
  SELECT
    id
  FROM
    site_branch_config
  WHERE
    "siteId" = ${siteId} AND
    context = '${context}' AND
    "deletedAt" IS NULL;
  `;
};

const updateDomainQuery = (id, sbcId) => {
  return `
    UPDATE
      domain
    SET
      "siteBranchConfigId" = ${sbcId}
    WHERE
      id = ${id};
  `;
};

exports.up = async function (db) {
  try {
    await db.addColumn(
      TABLE_NAME,
      COLUMN_NAME,
      COLUMN_INTERIM_SPEC,
      (error) => {
        if (error) throw error;
      }
    );

    const { rows: domains } = await db.runSql(SELECT_DOMAINS);

    const migrated = await Promise.all(
      domains.map(async (domain) => {
        const { id, siteId, context } = domain;
        const sbcQuery = getSBCQuery(siteId, context);
        const { rows: sbc } = await db.runSql(sbcQuery);
        const updateQuery = updateDomainQuery(id, sbc[0].id);

        const { rows } = await db.runSql(updateQuery);

        return rows;
      })
    );

    await db.changeColumn(
      TABLE_NAME,
      COLUMN_NAME,
      COLUMN_FINAL_SPEC,
      (error) => {
        if (error) throw error;
      }
    );

    console.log(`Updated ${migrated.length} domains.`);
    return null;
  } catch (error) {
    console.error(error);
    return error;
  }
};

exports.down = async function (db) {
  try {
    await db.removeForeignKey(TABLE_NAME, FOREIGN_KEY_NAME);
    await db.removeColumn(TABLE_NAME, COLUMN_NAME, (error) => {
      if (error) throw error;
    });

    return null;
  } catch (error) {
    console.error(error);
    return error;
  }
};
