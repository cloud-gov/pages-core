const lowercaseUsernames = (db, callback) => {
  const getUsers = () =>
    new Promise((resolve, reject) => {
      db.all('select * from "user"', (err, results) => {
        if (err) {
          reject(err);
        }

        resolve(results);
      });
    });

  const setUsernameToLowercase = (user) => {
    const { username, id } = user;

    const sql = `update "user" set "username"='${username.toLowerCase()}' where "id"='${id}'`;

    return new Promise((resolve, reject) => {
      db.runSql(sql, (err) => {
        if (err) {
          reject(err);
        }

        resolve();
      });
    });
  };

  const lowercaseAll = (users) => {
    if (!users.length) {
      return Promise.resolve();
    }

    return setUsernameToLowercase(users.pop()).then(() => lowercaseAll(users));
  };

  getUsers()
    .then(lowercaseAll)
    .then(() => callback())
    .catch((error) => callback(error));
};

exports.up = lowercaseUsernames;

exports.down = (db, callback) => callback();
