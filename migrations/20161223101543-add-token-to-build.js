const crypto = require('crypto');
const Promise = require('bluebird');
const URLSafeBase64 = require('urlsafe-base64');

const addBuildTokenColumn = (db) =>
  new Promise((resolve, reject) => {
    db.addColumn(
      'build',
      'token',
      {
        type: 'string',
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      },
    );
  });

const updateExistingBuilds = (db) => {
  let builds = [];
  return loadBuilds(db)
    .then((data) => {
      builds = data;
      return updateNextBuild(db, builds);
    })
    .then(() => db);
};

const loadBuilds = (db) =>
  new Promise((resolve, reject) => {
    db.all('SELECT * FROM "build"', (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(Object.keys(results).map((key) => results[key]));
      }
    });
  });

const updateNextBuild = (db, builds) => {
  if (builds.length === 0) {
    return Promise.resolve();
  }
  build = builds.pop();
  console.log(`Updating build: ${build.id}`);
  return updateBuildToken(db, build).then(() => updateNextBuild(db, builds));
};

const updateBuildToken = (db, build) => {
  const sql = `
    UPDATE "build"
    SET "token"='${token()}'
    WHERE "id" = '${build.id}'
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

const token = () => URLSafeBase64.encode(crypto.randomBytes(32));

const addNullConstraint = (db) =>
  new Promise((resolve, reject) => {
    db.changeColumn(
      'build',
      'token',
      {
        notNull: true,
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      },
    );
  });

exports.up = (db, callback) => {
  addBuildTokenColumn(db)
    .then(updateExistingBuilds)
    .then(addNullConstraint)
    .then(() => callback())
    .catch((err) => callback(err));
};

exports.down = (db, callback) => {
  db.removeColumn('build', 'token', callback);
};
