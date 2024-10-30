module.exports.up = (db, callback) => {
  db.createTable(
    'Sessions',
    {
      sid: 'string',
      expires: 'timestamp',
      data: 'text',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
    },
    callback,
  );
};

module.exports.down = (db, callback) => {
  db.dropTable('Sessions', callback);
};
