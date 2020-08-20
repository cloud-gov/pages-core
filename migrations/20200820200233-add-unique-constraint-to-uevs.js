
const TABLE = 'user_environment_variable';
const INDEX = 'user_environment_variable_site_name_idx';

exports.up = function(db, callback) {
  db.addIndex(TABLE, INDEX, ['siteId', 'name'], true, callback);
};

exports.down = function(db, callback) {
  db.removeIndex(TABLE, INDEX, callback);
};
