exports.up = (db, callback) =>
  db
    .runSql('CREATE INDEX "idxSiteDefaultConfig" ON site USING gin ("defaultConfig");')
    .then(() =>
      db.runSql('CREATE INDEX "idxSiteDemoConfig" ON site USING gin ("demoConfig");'),
    )
    .then(() =>
      db.runSql(
        'CREATE INDEX "idxSitePreviewConfig" ON site USING gin ("previewConfig");',
      ),
    )
    .then(() => callback())
    .catch(callback);

exports.down = (db, callback) =>
  db
    .runSql('DROP INDEX IF EXISTS "idxSiteDefaultConfig";')
    .then(() => db.runSql('DROP INDEX IF EXISTS "idxSiteDemoConfig";'))
    .then(() => db.runSql('DROP INDEX IF EXISTS "idxSitePreviewConfig";'))
    .then(() => callback())
    .catch(callback);
