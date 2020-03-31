exports.up = async (db) => {
	await db.runSql('CREATE INDEX IF NOT EXISTS "build_site_idx" ON build USING btree ("site");')
	await db.runSql('CREATE INDEX IF NOT EXISTS "build_user_idx" ON build USING btree ("user");')

	await db.runSql('CREATE INDEX IF NOT EXISTS "site_users__user_sites_user_sites_idx" ON site_users__user_sites USING btree ("user_sites");')
	await db.runSql('CREATE INDEX IF NOT EXISTS "site_users__user_sites_site_users_idx" ON site_users__user_sites USING btree ("site_users");')

	await db.runSql('CREATE INDEX IF NOT EXISTS "user_action_userId_idx" ON user_action USING btree ("userId");')
	await db.runSql('CREATE INDEX IF NOT EXISTS "user_action_actionId_idx" ON user_action USING btree ("actionId");')
	await db.runSql('CREATE INDEX IF NOT EXISTS "user_action_targetId_idx" ON user_action USING btree ("targetId");')
};

exports.down = async (db) => {
	await db.runSql('DROP INDEX IF EXISTS "build_site_idx";');
	await db.runSql('DROP INDEX IF EXISTS "build_user_idx";');

	await db.runSql('DROP INDEX IF EXISTS "site_users__user_sites_user_sites_idx";');
	await db.runSql('DROP INDEX IF EXISTS "site_users__user_sites_site_users_idx";');

	await db.runSql('DROP INDEX IF EXISTS "user_action_userId_idx";');
	await db.runSql('DROP INDEX IF EXISTS "user_action_actionId_idx";');
	await db.runSql('DROP INDEX IF EXISTS "user_action_targetId_idx";');
}
