exports.up = (db, callback) => {
  const newColConfig = {
    type: 'timestamp',
    notNull: true,
  };

  db.changeColumn('user_action', 'createdAt', newColConfig, (err) => {
    if (err) {
      callback(err);
    } else {
      db.changeColumn('user_action', 'updatedAt', newColConfig, callback);
    }
  });
};

exports.down = (db, callback) => {
  const oldColConfig = {
    type: 'date',
    notNull: true,
  };

  db.changeColumn('user_action', 'createdAt', oldColConfig, (err) => {
    if (err) {
      callback(err);
    } else {
      db.changeColumn('user_action', 'updatedAt', oldColConfig, callback);
    }
  });
};
