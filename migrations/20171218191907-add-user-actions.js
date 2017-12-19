module.exports.up = (db, callback) => {
  db.createTable('user_action', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    userId: { type: 'int', notNull: true },
    targetId: { type: 'int', notNull: true },
    targetType: { type: 'text', notNull: true },
    actionId: { type: 'int', notNull: true },
    created_at: { type: 'datetime', notNull: true },
    updated_at: { type: 'datetime', notNull: true },
  }, callback);
};

module.exports.down = (db, callback) => {
  db.dropTable('user_action', callback);
};
