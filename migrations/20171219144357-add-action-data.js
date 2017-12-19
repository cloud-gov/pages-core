/* eslint-disable */
const actionsExist = 'select count(*) from action_type;';

module.exports.up = (db) =>
  db.runSql(actionsExist)
    .then((out) => {
      if (out.rows.count !== 0) {
        return db.runSql("insert into action_type (action) values ('add'), ('remove'), ('update')");
      }
    })
    .catch((err) => {
      console.log(err);
    });

module.exports.down = (db, callback) => {
  callback();
};
