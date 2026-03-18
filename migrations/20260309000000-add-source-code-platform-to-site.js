const { buildSourceCodeUrl } = require('../api/utils/site');

const TABLE_NAME = 'site';

const SOURCE_CODE_PLATFORM_COLUMN = 'sourceCodePlatform';
const SOURCE_CODE_PLATFORM_COLUMN_TYPE = 'sourceCodePlatformType';
const SOURCE_CODE_PLATFORM_GITHUB = 'github';
const SOURCE_CODE_PLATFORM_WORKSHOP = 'workshop';

const SOURCE_CODE_URL_COLUMN = 'sourceCodeUrl';
const SOURCE_CODE_URL_TYPE_NULLABLE = {
  type: 'text',
  allowNull: true,
};
const SOURCE_CODE_URL_TYPE_NOT_NULL = {
  type: 'text',
  notNull: true,
};

const GITHUB_BASE_URL = 'https://github.com';
const OWNER_COLUMN = 'owner';
const REPOSITORY_COLUMN = 'repository';

const getSites = `SELECT id, owner, repository, "${SOURCE_CODE_PLATFORM_COLUMN}" from site`;
const cmdUpdateSiteSourceCodeUrl = (site) =>
  `UPDATE site SET "${SOURCE_CODE_URL_COLUMN}" = '${buildSourceCodeUrl(site.owner, site.repository, site.sourceCodePlatform, SOURCE_CODE_PLATFORM_WORKSHOP)}' WHERE id = ${site.id}`;

exports.up = async (db) => {
  await db.runSql(`
    CREATE TYPE "${SOURCE_CODE_PLATFORM_COLUMN_TYPE}" AS ENUM ('${SOURCE_CODE_PLATFORM_GITHUB}', '${SOURCE_CODE_PLATFORM_WORKSHOP}');
  `);

  await db.runSql(`
    ALTER TABLE ${TABLE_NAME} ADD COLUMN "${SOURCE_CODE_PLATFORM_COLUMN}" "${SOURCE_CODE_PLATFORM_COLUMN_TYPE}" NOT NULL DEFAULT '${SOURCE_CODE_PLATFORM_GITHUB}';
  `);

  await db.addColumn(TABLE_NAME, SOURCE_CODE_URL_COLUMN, SOURCE_CODE_URL_TYPE_NULLABLE);

  const sites = await db.runSql(getSites);
  for (const site of sites.rows) {
    await db.runSql(cmdUpdateSiteSourceCodeUrl(site));
  }

  await db.changeColumn(
    TABLE_NAME,
    SOURCE_CODE_URL_COLUMN,
    SOURCE_CODE_URL_TYPE_NOT_NULL,
  );
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, SOURCE_CODE_URL_COLUMN);
  await db.removeColumn(TABLE_NAME, SOURCE_CODE_PLATFORM_COLUMN);
  await db.runSql(`DROP TYPE "${SOURCE_CODE_PLATFORM_COLUMN_TYPE}";`);
};
