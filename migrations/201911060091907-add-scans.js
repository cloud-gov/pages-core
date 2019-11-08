module.exports.up = (db, callback) => {
  db.createTable('scan', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    user: { type: 'int', notNull: true },
    site: { type: 'int', notNull: true },
    issueId: { type: 'int' },
    data: { type: 'jsonb' },
    scannedAt: { type: 'timestamp' },
    createdAt: { type: 'timestamp', notNull: true },
    updatedAt: { type: 'timestamp', notNull: true },
    deletedAt: { type: 'timestamp' },
  }, callback);
};

module.exports.down = (db, callback) => {
  db.dropTable('scan', callback);
};
