var Sails = require('sails'),
  _ = require('underscore'),
  sails;

GLOBAL.helpers = require('./helpers');

before(function(done) {
  this.timeout(15000);

  Sails.lift({
    // configuration for testing purposes
    // Use memory for data store
    models: { connection: 'memory' },
    log: { level: 'info' }
  }, function(err, server) {
    sails = server;
    if (err) return done(err);
    // here you can load fixtures, etc.
    done(err, sails);
  });
});

after(function(done) {
  // sails.lower sometimes calls done twice https://github.com/balderdashy/sails/issues/3303
  sails.lower(_.once(done));
});
