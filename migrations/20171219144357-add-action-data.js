const actionsExist = 'select count(*) from action_type;';

module.exports.up = (db, callback) =>
  db
    .runSql(actionsExist)
    .then((out) => {
      if (out.rows.count !== 0) {
        db.runSql(
          "insert into action_type (action) values ('add'), ('remove'), ('update')",
        );
      }
    })
    .catch((err) => {
      callback(err);
    });

module.exports.down = (db, callback) => callback();
