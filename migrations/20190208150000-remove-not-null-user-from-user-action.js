exports.up = (db, callback) =>
  db.changeColumn('user_action', 'userId', {
    // type: 'integer',
    allowNull: true,
  }, callback);

exports.down = (db, callback) =>
  db.changeColumn('user_action', 'userId', {
    // type: 'integer',
    allowNull: false,
  }, callback);
