exports.up = (db, callback) =>
  db.runSql('CREATE INDEX "idxScanData" ON scan USING gin ("data");')
    .then(() => callback())
    .catch(callback);

exports.down = (db, callback) =>
  db.runSql('DROP INDEX IF EXISTS "idxScanData";')
    .then(() => callback())
    .catch(callback);
