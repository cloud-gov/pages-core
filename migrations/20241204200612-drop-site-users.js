'use strict';

exports.up = async (db) => {
  await db.runSql('DROP INDEX IF EXISTS "site_users__user_sites_user_sites_idx";');
  await db.runSql('DROP INDEX IF EXISTS "site_users__user_sites_site_users_idx";');
  return db.dropTable('site_users__user_sites');
};

exports.down = async (db) => {
  // TODO: down migration
};
