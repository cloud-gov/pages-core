exports.up = (db, callback) => db.addColumn('user', 'isActive', { type: 'boolean', notNull: true, defaultValue: false }, callback);

exports.down = (db, callback) => db.removeColumn('user', 'isActive', callback);
