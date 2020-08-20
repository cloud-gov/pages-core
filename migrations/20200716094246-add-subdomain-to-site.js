exports.up = (db, callback) => db.addColumn('site', 'subdomain', { type: 'string' }, callback);

exports.down = (db, callback) => db.removeColumn('site', 'subdomain', callback);
