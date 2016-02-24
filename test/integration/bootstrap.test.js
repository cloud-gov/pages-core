var Sails = require('sails'),
  _ = require('underscore'),
  sails;

GLOBAL.helpers = require('./helpers');
GLOBAL.webdriver = null;

before(function(done) {
  this.timeout(5000);

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

before(function () {
  this.timeout(15000); // Network latency can be really slow for initial connect
  webdriver = helpers.webdriver.createDriver();
  return webdriver.init();
});

after(function () {
  return webdriver.end();
});
