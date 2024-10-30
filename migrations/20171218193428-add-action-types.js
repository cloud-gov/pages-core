module.exports.up = (db, callback) => {
  db.createTable(
    'action_type',
    {
      id: {
        type: 'int',
        primaryKey: true,
        autoIncrement: true,
      },
      action: {
        type: 'string',
        length: 20,
        notNull: true,
      },
    },
    callback,
  );
};

module.exports.down = (db, callback) => {
  db.dropTable('action_type', callback);
};
