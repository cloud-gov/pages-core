var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;
var Sails = require('sails');

exports.up = function(db, callback) {
  Sails.lift({ hooks: {
    http: false,
    views: false,
    sockets: false,
    pubsub: false,
    grunt: false
  }}, function(err, sails) {

    // Add users with duplicate sites to lowest site
    Site.find({ sort: 'id asc' }).populate('users').exec(function(err, sites) {
      var groups = _(sites).map(function(site) {
            site.fullName = (site.owner + '/' + site.repository).toLowerCase();
            return site;
          }).groupBy(function(site) {
            return site.fullName;
          }).filter(function(group) {
            return group.length > 1;
          }).value();
      async.forEach(groups, function(group, done) {
        var primeSite = group[0],
            ids = _(primeSite.users).pluck('id').value();
        async.forEach(group, function(site, done) {
          if (!_.contains(ids, site.users[0].id)) {
            primeSite.users.add(site.users[0]);
            primeSite.save(done);
          } else {
            return done();
          }
        }, done);
      }, next);
    });

    // Delete all duplicate sites
    function next(err) {
      if (err) throw err;
      db.runSql('DELETE FROM site ' +
        'WHERE id IN (SELECT id ' +
          'FROM (SELECT id, ' +
            'ROW_NUMBER() OVER (partition BY owner, repository ' +
            'ORDER BY id) AS rnum ' +
            'FROM site) t ' +
          'WHERE t.rnum > 1);', function(err) {
        if (err) throw err;
        sails.lower(callback);
      });
    }

  });
};

exports.down = function(db, callback) {
  // Can't really reverse this one since it's deleting data
  callback();
};
