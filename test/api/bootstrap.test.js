const AWS = require('aws-sdk-mock')
const Sails = require('sails')

let sails

const _cleanDatabase = (sails) => {
  const promises = Object.keys(sails.models).map(key => {
    return sails.models[key].destroy({})
  })
  return Promise.all(promises)
}

before(function(done) {
  AWS.mock('SQS', 'sendMessage', function (params, callback) {
    callback(null, {})
  })

  Sails.lift((err, server) => {
    sails = server;
    if (err) return done(err);

    _cleanDatabase(sails).then(() => {
      done(null, sails);
    }).catch(err => {
      done(err)
    })
  });
});

after((done) => {
  sails.lower(done);
  AWS.restore('SQS')
});
