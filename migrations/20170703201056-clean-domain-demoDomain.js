// if field value starts with 'http://',
// then replace 'http://' with 'https://'
const httpToHttps = (field) =>
  `UPDATE site SET "${field}" = replace("${field}", 'http://', 'https://') ` +
  `WHERE "${field}" like 'http://%'`;

// if field value is not empty or null and doesn't start with 'https://',
// then prepend with 'https://'
const prependHttps = (field) =>
  `UPDATE site SET "${field}" = 'https://' || "${field}" ` +
  `WHERE "${field}" <> '' AND ` +
  `"${field}" NOT LIKE 'https://%'`;

exports.up = function up(db) {
  return db
    .runSql(httpToHttps('domain'))
    .then(() => {
      db.runSql(prependHttps('domain'));
    })
    .then(() => {
      db.runSql(httpToHttps('demoDomain'));
    })
    .then(() => {
      db.runSql(prependHttps('demoDomain'));
    })
    .catch((err) => {
      console.log(err); // eslint-disable-line no-console
    });
};

exports.down = function down(db, callback) {
  // noop reversal for this migration
  callback();
};
