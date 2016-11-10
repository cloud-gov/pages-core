var AWS = require('aws-sdk-mock')
var Sails = require('sails')

var sails

before(function(done) {
  AWS.mock('SQS', 'sendMessage', function (params, callback) {
    callback(null, {})
  })

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
  // here you can clear fixtures, etc.
  sails.lower(done);
  AWS.restore('SQS')
});
