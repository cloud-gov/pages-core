const Promise = require("bluebird")

const dbm = global.dbm || require('db-migrate');
const type = dbm.dataType;

const addColumnsToUserTable = (db) => {
  return new Promise((resolve, reject) => {
    db.addColumn("user", "githubAccessToken", "text", err => {
      if (err) {
        reject(err)
        return
      }
      db.addColumn("user", "githubUserId", "text", err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  })
}


const loadUsers = (db) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM \"user\"", (err, results) => {
      if (err) {
        reject(err)
      } else {
        resolve(Object.keys(results).map(key => {
          return results[key]
        }))
      }
    })
  })
}

const loadPassportForUser = (user, db) => {
  const sql = `
    SELECT (identifier, tokens->>'accessToken')
    FROM "passport"
    WHERE "user" = '${user.id}'
    ORDER BY "createdAt" DESC
  `

  return new Promise((resolve, reject) => {
    db.all(sql, (err, results) => {
      if (err) {
        reject(err)
      } else {
        if (results) {
          let resultArray = results["0"]["row"].slice(1, -1).split(",")
          resolve({
            identifier: resultArray[0],
            tokens: {
              accessToken: resultArray[1],
            },
          })
        } else {
          resolve()
        }
      }
    })
  })
}

const updateUserWithPassport = (user, passport, db) => {
  const sql = `
    UPDATE "user"
    SET "githubAccessToken"='${passport.tokens.accessToken}', "githubUserId"='${passport.identifier}'
    WHERE "id" = '${user.id}'
  `

  return new Promise((resolve, reject) => {
    db.runSql(sql, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

const dropPassportTable = (db) => {
  return new Promise((reject, resolve) => {
    db.dropTable("passport", err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

const migrateUpUserData = (user, db) => {
  return loadPassportForUser(user, db).then(passport => {
    if (passport) {
      return updateUserWithPassport(user, passport, db)
    } else {
      console.warn(`Unable to find passport for user: ${user.username}`)
      return Promise.resolve()
    }
  })
}

const migrateUpNextUser = (users, db) => {
  if (users.length > 0) {
    let user = users.pop()
    return migrateUpUserData(user, db).then(() => {
      console.log(`Migrated user: ${user.username}`)
      return migrateUpNextUser(users, db)
    })
  } else {
    return Promise.resolve()
  }
}

exports.up = function(db, callback) {
  addColumnsToUserTable(db).then(() => {
    return loadUsers(db)
  }).then(users => {
    return migrateUpNextUser(users, db)
  }).then(() => {
    return dropPassportTable(db)
  }).then(() => {
    callback()
  }).catch(err => {
    callback(err)
  })
}

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
  `

  return new Promise((resolve, reject) => {
    db.runSql(sql, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

const insertPassportRowForUser = (user, db) => {
  if (!user.githubUserId || !user.githubAccessToken) {
    console.warn(`Unable to find passport data for user: ${user.username}`)
    return Promise.resolve()
  }

  const sql = `
    INSERT INTO passport ("protocol", "provider", "identifier", "tokens", "user")
    VALUES ('oauth2', 'github', '${user.githubUserId}', '{ "accessToken": "${user.githubAccessToken}" }', '${user.id}');
  `

  return new Promise((resolve, reject) => {
    db.runSql(sql, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

const removeColumsFromUserTable = (db) => {
  return new Promise((resolve, reject) => {
    db.removeColumn("user", "githubAccessToken", err => {
      if (err) {
        reject(err)
        return
      }
      db.removeColumn("user", "githubUserId", err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  })
}

const migrateDownNextUser = (users, db) => {
  if (users.length > 0) {
    let user = users.pop()
    return insertPassportRowForUser(user, db).then(() => {
      console.log(`Migrated user: ${user.username}`)
      return migrateDownNextUser(users, db)
    })
  } else {
    return Promise.resolve()
  }
}

exports.down = function(db, callback) {
  createPassportTable(db).then(() => {
    return loadUsers(db)
  }).then(users => {
    return migrateDownNextUser(users, db)
  }).then(() => {
    return removeColumsFromUserTable(db)
  }).then(() => {
    callback()
  }).catch(err => {
    callback(err)
  })
}
