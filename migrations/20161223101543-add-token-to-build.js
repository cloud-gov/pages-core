const crypto = require("crypto")
const Promise = require("bluebird")
const URLSafeBase64 = require('urlsafe-base64')

const addBuildTokenColumn = (db) => {
  return new Promise((resolve, reject) => {
    db.addColumn("build", "token", {
      type: "string",
    }, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(db)
      }
    })
  })
}

const updateExistingBuilds = (db) => {
  let builds = []
  return loadBuilds(db).then(data => {
    builds = data
    return updateNextBuild(db, builds)
  }).then(() => {
    return db
  })
}

const loadBuilds = (db) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM \"build\"", (err, results) => {
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

const updateNextBuild = (db, builds) => {
  if (builds.length === 0) {
    return Promise.resolve()
  } else {
    build = builds.pop()
    console.log(`Updating build: ${build.id}`)
    return updateBuildToken(db, build).then(() => {
      return updateNextBuild(db, builds)
    })
  }
}

const updateBuildToken = (db, build) => {
  const sql = `
    UPDATE "build"
    SET "token"='${token()}'
    WHERE "id" = '${build.id}'
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

const token = () => {
  return URLSafeBase64.encode(crypto.randomBytes(32))
}

const addNullConstraint = (db) => {
  return new Promise((resolve, reject) => {
    db.changeColumn("build", "token", {
      notNull: true,
    }, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(db)
      }
    })
  })
}

exports.up = (db, callback) => {
  addBuildTokenColumn(db)
    .then(updateExistingBuilds)
    .then(addNullConstraint)
    .then(() => callback())
    .catch(err => callback(err))
}

exports.down = (db, callback) => {
  db.removeColumn("build", "token", callback)
}
