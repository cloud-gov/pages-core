exports.up = (db, callback) =>
  Promise.all([
    db.runSql(
      'CREATE INDEX IF NOT EXISTS "build_site_idx" ON build USING btree ("site");',
    ),
    db.runSql(
      'CREATE INDEX IF NOT EXISTS "build_user_idx" ON build USING btree ("user");',
    ),
    db.runSql(
      'CREATE INDEX IF NOT EXISTS "site_users__user_sites_user_sites_idx" ON site_users__user_sites USING btree ("user_sites");',
    ),
    db.runSql(
      'CREATE INDEX IF NOT EXISTS "site_users__user_sites_site_users_idx" ON site_users__user_sites USING btree ("site_users");',
    ),
    db.runSql(
      'CREATE INDEX IF NOT EXISTS "user_action_userId_idx" ON user_action USING btree ("userId");',
    ),
    db.runSql(
      'CREATE INDEX IF NOT EXISTS "user_action_actionId_idx" ON user_action USING btree ("actionId");',
    ),
    db.runSql(
      'CREATE INDEX IF NOT EXISTS "user_action_targetId_idx" ON user_action USING btree ("targetId");',
    ),
  ]).then(() => callback());

exports.down = (db, callback) =>
  Promise.all([
    db.runSql('DROP INDEX IF EXISTS "build_site_idx";'),
    db.runSql('DROP INDEX IF EXISTS "build_user_idx";'),
    db.runSql('DROP INDEX IF EXISTS "site_users__user_sites_user_sites_idx";'),
    db.runSql('DROP INDEX IF EXISTS "site_users__user_sites_site_users_idx";'),
    db.runSql('DROP INDEX IF EXISTS "user_action_userId_idx";'),
    db.runSql('DROP INDEX IF EXISTS "user_action_actionId_idx";'),
    db.runSql('DROP INDEX IF EXISTS "user_action_targetId_idx";'),
  ]).then(() => callback());
