module.exports.up = (db, callback) => {
  db.createTable("UserAction", {
    id: { type: 'int', primaryKey: true, autoIncrement: true, },
    userId: { type: 'int', notNull: true },
    targetId: { type: 'int', notNull: true },
    targetTypeId: { type: 'int', notNull: true },
    actionId: { type: 'int', notNull: true },
    createdAt: { type: 'timestamp', notNull: true }
  }, callback)
}

module.exports.down = (db, callback) => {
  db.dropTable("UserAction", callback)
}
