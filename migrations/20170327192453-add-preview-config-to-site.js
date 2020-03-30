// const dbm = global.dbm || require('db-migrate');
// const type = dbm.dataType;

exports.up = function (db, callback) {
  db.addColumn('site', 'previewConfig', 'text', (err) => {
    if (err) {
      callback(err);
    } else {
      db.runSql('UPDATE site SET "previewConfig" = config', (err) => {
        if (err) {
          callback(err);
        } else {
          callback();
        }
      });
    }
  });
};

exports.down = function (db, callback) {
  db.removeColumn('site', 'previewConfig', callback);
};
