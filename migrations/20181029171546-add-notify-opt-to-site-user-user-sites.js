exports.up = (db, callback) =>
  db.addColumn(
    'site_users__user_sites',
    'buildNotificationSetting',
    {
      type: 'string',
    },
    callback,
  );

exports.down = (db, callback) =>
  db.removeColumn('site_users__user_sites', 'buildNotificationSetting', callback);
