const Promise = require('bluebird');

const dbm = global.dbm || require('db-migrate');

const type = dbm.dataType;

const addColumnsToUserTable = (db) =>
  new Promise((resolve, reject) => {
    db.addColumn('user', 'githubAccessToken', 'text', (err) => {
      if (err) {
        reject(err);
        return;
      }
      db.addColumn('user', 'githubUserId', 'text', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

const loadUsers = (db) =>
  new Promise((resolve, reject) => {
    db.all('SELECT * FROM "user"', (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(Object.keys(results).map((key) => results[key]));
      }
    });
  });

const loadPassportForUser = (user, db) => {
  const sql = `
    SELECT (identifier, tokens->>'accessToken')
    FROM "passport"
    WHERE "user" = '${user.id}'
    ORDER BY "createdAt" DESC
  `;

  return new Promise((resolve, reject) => {
    db.all(sql, (err, results) => {
      if (err) {
        reject(err);
      } else if (results) {
        const resultArray = results['0'].row.slice(1, -1).split(',');
        resolve({
          identifier: resultArray[0],
          tokens: {
            accessToken: resultArray[1],
          },
        });
      } else {
        resolve();
      }
    });
  });
};

const updateUserWithPassport = (user, passport, db) => {
  const sql = `
    UPDATE "user"
    SET "githubAccessToken"='${passport.tokens.accessToken}', "githubUserId"='${passport.identifier}'
    WHERE "id" = '${user.id}'
  `;

  return new Promise((resolve, reject) => {
    db.runSql(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const dropPassportTable = (db) =>
  new Promise((reject, resolve) => {
    db.dropTable('passport', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

const migrateUpUserData = (user, db) =>
  loadPassportForUser(user, db).then((passport) => {
    if (passport) {
      return updateUserWithPassport(user, passport, db);
    }
    console.warn(`Unable to find passport for user: ${user.username}`);
    return Promise.resolve();
  });

const migrateUpNextUser = (users, db) => {
  if (users.length > 0) {
    const user = users.pop();
    return migrateUpUserData(user, db).then(() => {
      console.log(`Migrated user: ${user.username}`);
      return migrateUpNextUser(users, db);
    });
  }
  return Promise.resolve();
};

exports.up = function (db, callback) {
  addColumnsToUserTable(db)
    .then(() => loadUsers(db))
    .then((users) => migrateUpNextUser(users, db))
    .then(() => dropPassportTable(db))
    .then(() => {
      callback();
    })
    .catch((err) => {
      callback(err);
    });
};

const createPassportTable = (db) => {
  const sql = `
    CREATE TABLE passport (
      protocol text,
      password text,
      "accessToken" text,
      provider text,
      identifier text,
      tokens json,
      "user" integer,
      id SERIAL,
      "createdAt" timestamp with time zone,
      "updatedAt" timestamp with time zone
    );
  `;

  return new Promise((resolve, reject) => {
    db.runSql(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const insertPassportRowForUser = (user, db) => {
  if (!user.githubUserId || !user.githubAccessToken) {
    console.warn(`Unable to find passport data for user: ${user.username}`);
    return Promise.resolve();
  }

  const sql = `
    INSERT INTO passport ("protocol", "provider", "identifier", "tokens", "user")
    VALUES ('oauth2', 'github', '${user.githubUserId}', '{ "accessToken": "${user.githubAccessToken}" }', '${user.id}');
  `;

  return new Promise((resolve, reject) => {
    db.runSql(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const removeColumsFromUserTable = (db) =>
  new Promise((resolve, reject) => {
    db.removeColumn('user', 'githubAccessToken', (err) => {
      if (err) {
        reject(err);
        return;
      }
      db.removeColumn('user', 'githubUserId', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

const migrateDownNextUser = (users, db) => {
  if (users.length > 0) {
    const user = users.pop();
    return insertPassportRowForUser(user, db).then(() => {
      console.log(`Migrated user: ${user.username}`);
      return migrateDownNextUser(users, db);
    });
  }
  return Promise.resolve();
};

exports.down = function (db, callback) {
  createPassportTable(db)
    .then(() => loadUsers(db))
    .then((users) => migrateDownNextUser(users, db))
    .then(() => removeColumsFromUserTable(db))
    .then(() => {
      callback();
    })
    .catch((err) => {
      callback(err);
    });
};
