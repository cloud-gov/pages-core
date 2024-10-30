module.exports.up = (db, callback) => {
  db.createTable(
    'user_action',
    {
      id: {
        type: 'int',
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: 'int',
        notNull: true,
      },
      targetId: {
        type: 'int',
        notNull: true,
      },
      targetType: {
        type: 'text',
        notNull: true,
      },
      actionId: {
        type: 'int',
        notNull: true,
      },
      createdAt: {
        type: 'date',
        notNull: true,
      },
      updatedAt: {
        type: 'date',
        notNull: true,
      },
    },
    callback,
  );
};

module.exports.down = (db, callback) => {
  db.dropTable('user_action', callback);
};
