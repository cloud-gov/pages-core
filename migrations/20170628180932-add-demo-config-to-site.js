exports.up = function up(db, callback) {
  db.addColumn('site', 'demoConfig', 'text', (addColErr) => {
    if (addColErr) {
      callback(addColErr);
    } else {
      db.runSql('UPDATE site SET "demoConfig" = config', (runErr) => {
        if (runErr) {
          callback(runErr);
        } else {
          callback();
        }
      });
    }
  });
};

exports.down = function down(db, callback) {
  db.removeColumn('site', 'demoConfig', callback);
};
