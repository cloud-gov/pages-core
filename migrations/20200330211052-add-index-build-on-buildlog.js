exports.up = (db, callback) => db.addIndex('buildlog', { fields: ['build'] }, callback);

exports.down = (db, callback) => db.removeIndex('buildlog', ['build'], callback);
